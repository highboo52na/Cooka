# DataFrames
import os

from cooka.common import util
from cooka.common.serializer import ListBeanField, Bean
import pandas as pd
from cooka.common.log import log_core as logger
from cooka.common.model import Feature, FeatureTypeStats, DatasetStats, ContinuousFeatureBin, ContinuousFeatureExtension, FeatureValueCount, \
    CategoricalFeatureExtension, DatetimeFeatureExtension, YearValueCount, FeatureType, FeatureMode, SampleConf,\
    FeatureUnique, FeatureMissing, FeatureCorrelation
from sklearn.compose import make_column_selector


class Analyzer(object):
    pass


class PandasAnalyzer(Analyzer):

    @staticmethod
    def get_analyze_df(file_path, sample_chunksize, header):
        # infer
        if sample_chunksize > -1:
            df_iterator = pd.read_csv(file_path, chunksize=sample_chunksize, header=header)
            return df_iterator.get_chunk()  # use first chunk
        else:
            # use whole data
            return pd.read_csv(file_path, header=header)

    def __init__(self, file_path: str, label_col: str, sample_conf: SampleConf):

        # 1. check params
        if not os.path.exists(file_path):
            raise FileExistsError("File not found: %s" % file_path)

        self.file_path = file_path
        self.sample_conf = sample_conf
        self.label_col = label_col

        # 2. check headers
        is_has_header = self.is_csv_file_has_header(file_path)
        self.is_has_header = is_has_header

        # 3. calc sample chunk size
        self.n_rows = self._count_lines(file_path, is_has_header)
        if sample_conf.sample_strategy == SampleConf.Strategy.RandomRows:
            sample_chunksize = sample_conf.n_rows

        elif sample_conf.sample_strategy ==  SampleConf.Strategy.Percentage:
            sample_chunksize = round(self.n_rows * sample_conf.percentage / 100)

        elif sample_conf.sample_strategy == SampleConf.Strategy.WholeData:
            sample_chunksize = -1

        else:
            raise ValueError(f"Unsupported sample strategy = {sample_conf.sample_strategy}")

        # 4. read data
        if not is_has_header:
            # 4.1. update columns
            self.df = self.get_analyze_df(file_path, sample_chunksize, None)
            self.df.columns = ["c%s" % c for c in self.df.columns]  # generate name for df
        else:
            self.df = self.get_analyze_df(file_path, sample_chunksize, 'infer')

        self.n_cols = self.df.shape[1]  # read file columns

        if self.sample_conf.sample_strategy == SampleConf.Strategy.WholeData:
            self.n_rows_used = self.n_rows
        else:
            self.n_rows_used = sample_chunksize

        # 3. to fix date types
        categorical_cols = make_column_selector(dtype_include=['object'])(self.df)
        self.df[categorical_cols] = self.df[categorical_cols].applymap(self.parse_date)

    @staticmethod
    def is_csv_file_has_header(path):
        df_no_header: pd.DataFrame = next(pd.read_csv(path, chunksize=100, header=None))
        for col in df_no_header.dtypes.to_dict():
            type_name = df_no_header.dtypes[col].name
            # only this case
            if 'float' in type_name or 'int' in type_name or 'datetime' in type_name or 'timestamp' in type_name:
                return False
        return True

    @staticmethod
    def parse_date(t):
        format = "%Y-%m-%d %H:%M:%S"
        try:
            if isinstance(t, str):
                return pd.datetime.strptime(t, format)
            else:
                return t
        except Exception as e:
            return t

    def _count_lines(self, path, is_has_header):
        count = 0
        with open(path, 'r') as f:
            for _ in f.readlines():
                count = count + 1
        if count > 0:
            if is_has_header is True:
                return count - 1  # remove header
            else:
                return count
        else:
            return 0

    def analyze_col(self, col_name, missing):
        series = self.df[col_name]

        unique_value = int(self.df[col_name].value_counts().count())
        type_name = self.df.dtypes[col_name].name

        # del missing label
        # label encoder label
        # calc relevance
        # not for text

        feature_type = self.infer_feature_type(type_name)
        extension = None
        if feature_type == FeatureType.Continuous:
            # 1. defaule set to 10 bins
            bins = [ContinuousFeatureBin(begin=k.left, end=k.right, value=v) for k, v in pd.value_counts(pd.cut(series, 10)).items()]

            # 2. describe
            series_d = series.describe()
            feature_value_count = pd.value_counts(series)
            value_count = [FeatureValueCount(type=k, value=v, percentage=v/series.shape[0]) for k, v in feature_value_count.items()]
            extension = \
                ContinuousFeatureExtension(bins=bins,
                                           min=series_d['min'],
                                           max=series_d['max'],
                                           mean=series_d['mean'],
                                           stddev=series_d['std'],
                                           median=series_d['50%'],
                                           value_count=value_count)
        elif feature_type == FeatureType.Categorical:
            series_d = series.describe()

            feature_value_count = pd.value_counts(series)
            mode_value = series_d['top']
            mode_count = int(feature_value_count[mode_value])
            mode = FeatureMode(value=str(mode_value), count=mode_count, percentage=round(mode_count/self.df.shape[0] * 100, 2))  # todo add unit test

            value_count = [FeatureValueCount(type=str(k), value=v, percentage=v/series.shape[0]) for k, v in feature_value_count.items()]
            extension = \
                CategoricalFeatureExtension(value_count=value_count, mode=mode)

        elif feature_type == FeatureType.Datetime:
            def to_int(v):
                try:
                    return int(v)
                except Exception:
                    return v

            by_year_dict = series.map(lambda _: to_int(_.year)).value_counts()
            by_month_dict = series.map(lambda _: to_int(_.month)).value_counts()
            by_week_dict = series.map(lambda _: to_int(_.dayofweek)).value_counts()  # +1
            by_hour_dict = series.map(lambda _: to_int(_.hour)).value_counts()

            by_month = [int(by_month_dict.get(float(i), 0)) for i in range(12)]
            by_hour = [int(by_hour_dict.get(float(i), 0)) for i in range(24)]
            by_week = [int(by_week_dict.get(float(i), 0)) for i in range(7)]
            by_year = [YearValueCount(year=int(year), value=count) for year, count in by_year_dict.items()]

            extension = \
                DatetimeFeatureExtension(by_year=by_year, by_month=by_month, by_week=by_week,by_hour=by_hour)

        if extension is not None:
            extension = extension.to_dict()
        n_rows = series.shape[0]

        unique_percentage = unique_value/n_rows * 100
        feature_unique = FeatureUnique(value=unique_value, percentage=unique_percentage,
                                       status=FeatureUnique.calc_status(unique_value, unique_percentage))
        missing_percentage = missing/n_rows*100
        feature_missing = FeatureMissing(value=missing, percentage=missing_percentage,
                                         status=FeatureMissing.calc_status(missing_percentage))

        # feature_correlation = FeatureCorrelation(value=unique_value, percentage=unique_value/, status=) 相关性在分析那里

        return Feature(name=col_name,
                       type=feature_type,
                       data_type=series.dtype.name,
                       missing=feature_missing,
                       unique=feature_unique,
                       extension=extension)

    def do_analyze_csv(self) -> DatasetStats:
        df = self.df

        n_cols = len(df.columns)
        missing_dict = df.isnull().sum()
        features = [self.analyze_col(col_name, int(missing_dict[col_name]), ) for col_name in df.columns]
        feature_type_dict = pd.Series(data=[f.type for f in features], name='feature_type').value_counts().to_dict()
        fts = FeatureTypeStats(**feature_type_dict)

        return DatasetStats(has_header=self.is_has_header, n_rows=self.n_rows, n_cols=n_cols, features=features, feature_summary=fts)

        # df['SepalLengthCm'].value_counts().compute()

        # X1.corr(Y1, method="pearson")

    def infer_feature_type(self, type_name):
        if 'float' in type_name  or 'int'  in type_name:
            return FeatureType.Continuous
        elif 'datetime' in type_name :
            return FeatureType.Datetime
        else:
            # todo CategoricalInt
            # todo infer text
            return FeatureType.Categorical
