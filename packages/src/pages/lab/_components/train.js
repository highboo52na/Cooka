import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Radio, Card, Row, Col, Slider, InputNumber, Button, Tooltip } from 'antd';
import { QuestionCircleOutlined} from '@ant-design/icons';
import { connect } from 'dva';
import { withRouter } from 'umi';
import { formatMessage } from 'umi-plugin-locale';
import { Pie, HBChart, CookaSlider } from 'components';
import LabelChart from './LabelChart/index.js'
import styles from '../index.less';
import { getRecommendConfig, interTasktype, getDataRetrieve } from '@/services/dataset';
import { makeToolTipFromMsgId } from '@/utils/util';



const { Option } = Select;

const defaultData = [{
  name: `${formatMessage({id: 'extra.trainUnion'})}`,
  // name: '训练集',
  count: 80,
  color: 'rgba(49, 154, 228, 1)',
}, {
  name: `${formatMessage({id: 'extra.verifyUnion'})}`,
  // name: '验证集',
  count: 10,
  color: 'rgba(6, 194, 97, 1)',
}, {
  name: `${formatMessage({id: 'extra.testUnion'})}`,
  // name: '测试集',
  count: 10,
  color: 'rgba(225, 67, 68, 1)',
}];

const Train = ({ train: { labelName }, dispatch, location: { query: { datasetName } }}) => {

  const frameworkTypes = ['HyperGBM', 'DeepTables']  // first as default value

  const dataRef = useRef();
  const [dataType, setDataType] = useState('train_validation_holdout');
  const [labelData, setLabelData] = useState(null);  // 标签对应的 data
  const [posLabelValues, setPosLabelValues] = useState(null);  // 正样本选择数据
  const [labelType, setLabelType] = useState('');   // 标签的 type
  const [experimentEngine, setExperimentEngine] = useState(frameworkTypes[0]);   // 标签的 type
  const [labelValue, setLabelValue] = useState('')  // 选择的标签列名
  const [posValue, setPosValue] = useState('');
  const [taskType, setTaskType] = useState(''); // 是否是二分类模型
  const [mode, setMode] = useState('quick');
  const [divisionNumber, setDivisionNumber] = useState(5);
  const [testPercentage, setTestPercentage] = useState(20);
  const [dateValue, setDateValue] = useState('');
  const [labelTipVisible, setLabelTipVisible] = useState(false);
  const [binaryTipVisible, setBinaryTipVisible] = useState(false);
  const [sliderData, setSliderData] = useState(defaultData);
  const [features, setFeatures] = useState([]);

  const labelColArr = features?.filter(feature => feature.type === 'continuous' || feature.type === 'categorical') || [];
  const datetimeColArr = features?.filter(feature => feature.type === 'datetime') || [];
  const [form] = Form.useForm();

  // 如果从数据探查的 去训练 按钮进来的 需要将该标签列以及其图表默认展示
  useEffect(() => {
    const params = { datasetName };
    getDataRetrieve(params).then((originRes) => {
      const res = originRes.data;
      const features = res.features;
      if (features.length) {
        features.forEach((item, index) => {
          item.key = index;
          if (item.type === 'continuous') {
            item.hData = [];
            item.extension.bins.map((bin) => {
              item.hData.push({
                value: [bin.begin, bin.end],
                count: bin.value
              })
            })
          } else if (item.type === 'datetime') {
            const hour = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
            item.barHourData = [];
            const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            item.barMonthData = [];
            const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            item.barWeekData = [];
            item.barYearData = [];
            item.extension.by_hour.forEach((hourData, index) => {
              item.barHourData.push({
                time: hour[index],
                value: hourData
              })
            });
            item.extension.by_month.forEach((monthData, index) => {
              item.barMonthData.push({
                time: month[index],
                value: monthData
              })
            });
            item.extension.by_week.forEach((weekData, index) => {
              item.barWeekData.push({
                time: week[index],
                value: weekData
              })
            });
            item.extension.by_year.forEach((yearData, index) => {
              item.barYearData.push({
                time: String(yearData['year']),
                value: yearData['value']
              })
            })
          }
        })
      }
      res && setFeatures(res.features)
      // if (labelName) {
      //   setLabelValue(labelName);
      //   features.forEach(feature => {
      //     if(feature.name === labelName) {
      //       if (feature.type === 'continuous') {
      //         setLabelData(feature.hData);
      //       } else if (feature.type === 'categorical') {
      //         setLabelData(feature.extension.value_count);
      //       }
      //       setLabelType(feature.type)
      //     }
      //   });
      //   dispatch({
      //     type: 'train/inferTasktype',
      //     payload: {
      //       datasetName,
      //       params: {
      //         feature_name: labelName,
      //       },
      //       callback:(res) => {
      //         setTaskType(res.task_type);
      //       }
      //     }
      //   })
      // } else {
        const reqRecommendConfParams = { datasetName: datasetName, param: {target_col: labelName} }
        getRecommendConfig(reqRecommendConfParams).then((originRes) => {
          const config = originRes.data;
          const params = {
            datasetName,
            params: {
              feature_name: config.conf.label_col,
            },
          }
          setLabelValue(config.conf.label_col);
          setPosValue(config.conf.pos_label);
          setMode(config.conf.train_mode);
          setDataType(config.conf.partition_strategy);
          defaultData[0].count = 80;
          defaultData[1].count = 10;
          defaultData[2].count = 10;
          setSliderData(defaultData);
          features.forEach(feature => {

            if(feature.name === config.conf.label_col) {
              setPosLabelValues(feature.extension.value_count)
              if (feature.type === 'continuous') {
                setLabelData(feature.hData);
              } else if (feature.type === 'categorical') {
                setLabelData(feature.extension.value_count);
              }
              setLabelType(feature.type)
            }
          });
          interTasktype(params).then((originRes) => {
            const res = originRes.data;
            setTaskType(res.task_type);
          })
        })
      //}
    })
  }, [labelName]);


  // 标签列 select
  const handleLabelChange = (val) => {
    setLabelTipVisible(false);
    setLabelValue(val);
    features.forEach(feature => {
      if(feature.name === val) {
        if (feature.type === 'continuous') {
          setLabelData(feature.hData);
        } else if (feature.type === 'categorical') {
          setLabelData(feature.extension.value_count);
        }
        setLabelType(feature.type)
      }
    });
    dispatch({
      type: 'train/inferTasktype',
      payload: {
        datasetName,
        params: {
          feature_name: val,
        },
        callback:(res) => {
          setTaskType(res.task_type);
        }
      }
    })
  }
  const handleModeChange = (e) => {
    setMode(e.target.value)
  }
  const handleDataChange = (e) => {
    setDataType(e.target.value)
  }
  const handleDateChange = (val) => {
    setDateValue(val)
  }

  const onChange = value => {
    if (isNaN(value)) {
      return;
    }
    setDivisionNumber(value);
  };

  const onTestChange = value => {
    if (isNaN(value)) {
      return;
    }
    setTestPercentage(value);
  };

  // 数据分配标题
  const analysisTitle = (
    <>
      <Radio.Group onChange={(e) => handleDataChange(e)} value={dataType} style={{ marginTop: 12 }}>
        <Radio value='train_validation_holdout'>{formatMessage({ id: 'extra.testAndTrain' })}</Radio>
        {/*<Radio value='cross_validation' style={{ marginLeft: 50 }}>{formatMessage({ id: 'train.crossVerified' })}</Radio>*/}
      </Radio.Group>
    </>
  );
  // 数据分配内容部分
  const getAnalysisContent = () => {
    if (dataType === 'cross_validation') {
      return (
        <>
          <dl>
            <dt>{formatMessage({ id: 'train.divisionNum' })}</dt>
          </dl>
          <Row>
            <Col span={12}>
              <Slider
                min={2}
                max={50}
                onChange={onChange}
                value={typeof divisionNumber === 'number' ? divisionNumber : 0}
                step={1}
                tooltipVisible={false}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={2}
                max={50}
                style={{ margin: '0 16px' }}
                step={1}
                value={divisionNumber}
                // formatter={value => `${value}%`}
                onChange={onChange}
              />
            </Col>
          </Row>
          <dl>
            <dt>{formatMessage({id: 'train.testUnionPercentage'})}</dt>
          </dl>
          <Row>
            <Col span={12}>
              <Slider
                min={10}
                max={80}
                onChange={onTestChange}
                value={typeof testPercentage === 'number' ? testPercentage : 0}
                step={1}
                tooltipVisible={false}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={10}
                max={80}
                style={{ margin: '0 16px' }}
                step={1}
                value={testPercentage}
                formatter={testPercentage => `${testPercentage}%`}
                onChange={onTestChange}
              />
            </Col>
          </Row>
          <Row>
            <Col span={18}>
              <div className={styles.barWrapper}>
                <div className={styles.cvdata} style={{ width: `${100 - testPercentage}%`, overflow: 'hidden' }}>
                  {
                    Array.apply(null,{length: divisionNumber}).map((_, index) => {
                      return (
                        <span style={{ flex: 1, backgroundColor: '#0090DC', borderRight: '1px solid #fff' }}></span>
                      )
                    })
                  }
                </div>
                <div className={styles.testdata} style={{ flex: 1, width: `${testPercentage}%`, backgroundColor: '#E73B40'}}></div>
              </div>
              <div className={styles.legend}>
                <div className={styles.number}>
                  <span className={styles.cvdataCir}></span>
                  <span className={styles.symbol}>{formatMessage({id: 'train.cvdata'})}</span>
                </div>
                <div className={styles.type}>
                  <span className={styles.testCir}></span>
                  <span className={styles.symbol}>{formatMessage({id: 'train.testUnion'})}</span>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )
    } else {
      return (
        <div style={{ width: 800 }}>
          <CookaSlider dataRef={dataRef} sliderData={sliderData}  />
        </div>
      )
    }
  }

  const handlePosChange = (val) => {
    setBinaryTipVisible(false)
    setPosValue(val)
  }

  const handleExperimentEngineChange = (val) => {
    setExperimentEngine(val)
  }


  // 训练
  const handleTrain = () => {
    const data = dataRef.current.getData();

    let param =  {
      label_col: labelValue, // 标签列
      pos_label: posValue,
      train_mode: mode, // 训练模式

      experiment_engine: experimentEngine,
      holdout_percentage: data[2].count,  // 测试集比例
      // holdout_percentage: divisionNumber,  // 测试集比例
      datetime_series_col: dateValue // 日期列
    };

    if (dataType === 'cross_validation') {
      param['partition_strategy'] = 'cross_validation';  // 数据分配模式
      param['cross_validation'] =  {
        n_folds: testPercentage,  // 分割数
      }
    } else if (dataType === 'train_validation_holdout') {
      param['partition_strategy'] = 'train_validation_holdout';  // 数据分配模式
      param['train_validation_holdout'] = {
        train_percentage: data[0].count,  // 分割数
        validation_percentage: data[1].count
      }
    }

    const params = {
      datasetName,
      param,
    }
    if (params['param'].hasOwnProperty('label_col') && params['param']['label_col'] === undefined) {
      setLabelTipVisible(true);
      return;
    }
    if (params['param'].hasOwnProperty('pos_label') && params['param']['pos_label'] === '') {
      setBinaryTipVisible(true);
      return;
    }
    dispatch({
      type: 'train/train',
      payload: params
    })
  }

  const handleDatetimeSelectorPlaceholder = () => {
    if(datetimeColArr && datetimeColArr.length === 0){
      return formatMessage({ id: 'train.datetimeColSelectorNoItem'})
    }else{
      return formatMessage({ id: 'train.select'})
    }
  }

  const taskTypeMessageIdMapping = {
    multi_classification: "train.taskMultiClassification",
    binary_classification: "train.taskBinaryClassification",
    regression: "train.taskRegression",
  }

  const taskTypeMessageId = taskTypeMessageIdMapping[taskType]

  const makeBody = (content) => {
    return <span style={{ color: '#c4c4c4', marginLeft: 2 }}>{content}</span>
  }

   return (
    <Form form={form}>
      <div className={styles.basic}>
        <dl className={styles.tag}>
          <dt>
            <span>{formatMessage({id: 'train.tagCol'})}</span>
          </dt>
          <dd>
            <div>
              {makeBody(formatMessage({id: 'train.hintTarget'}))}
            </div>
            <span>
              <Select value={labelValue} placeholder={formatMessage({id: 'train.select'})} style={{ width: 300, marginBottom: 20 }} onChange={handleLabelChange}>
                {
                  labelColArr && labelColArr.map(label => {
                    return (
                      <Option value={label.name}>{label.name}</Option>
                    )
                  })
                }
              </Select>
            </span>
            <Button type="primary" style={{ marginLeft: 10 }} onClick={handleTrain}>{formatMessage({id: 'train.train'})}</Button>
          </dd>
          {
            labelTipVisible ? (
              <div className={styles.labelTip} style={{ marginTop: -20 }}>{formatMessage({id: 'train.labelNotEmpty'})}</div>
            ) : null
          }
        </dl>
        <dl>
          {
            taskType.length !== 0 && (
              <>
                <dt>
                  {formatMessage({ id: 'train.taskType'})}
                  {makeToolTipFromMsgId('train.hintTaskType')}
                </dt>
                <dd>
                  <span style={{ color: '#c4c4c4', marginLeft: 2 }}>  {formatMessage({id: 'train.hintInferTaskType'}, {taskType: formatMessage({id: taskTypeMessageId}) })}   </span>
                </dd>
              </>
            )
          }
        </dl>
        <dl>
          <LabelChart labelType={labelType} labelData={labelData} />
        </dl>
        {
          taskType === 'binary_classification' && (
            <dl className={styles.binary}>
              <dt>
                {formatMessage({id: 'train.normalSampleModal'})}
                {makeToolTipFromMsgId('train.hintPositiveLabel')}
              </dt>
              <dd>
                <Select value={posValue} placeholder={formatMessage({ id: 'train.select'})} style={{ width: 300 }} onChange={handlePosChange}>
                  {
                    posLabelValues && posLabelValues.map((item, index) => {
                      return (
                        <Option value={item.type} key={index}>{item.type}</Option>
                      )
                    })
                  }
                </Select>
              </dd>
              {
                binaryTipVisible ? (
                  <div className={styles.labelTip}>{formatMessage({id: 'train.posNotEmpty'})}</div>
                ) : null
              }
            </dl>
          )
        }
        <dl className={styles.mode}>
          <dt>{formatMessage({id: 'train.experimentEngine'})}
            {makeToolTipFromMsgId('train.hintExperimentEngine')}
          </dt>
          <dd>
            <Select value={experimentEngine} placeholder={formatMessage({ id: 'train.select'})} style={{ width: 300 }} onChange={v => {setExperimentEngine(v)}}>
              {
                frameworkTypes.map(v => {
                  return (
                    <Option value={v} key={v}>{v}</Option>
                  )
                })
              }
            </Select>
          </dd>
        </dl>
        <dl className={styles.mode}>
          <dt>{formatMessage({id: 'train.trainMode'})}
            {makeToolTipFromMsgId('train.hintTrainMode')}
          </dt>
          <dd>
            <Radio.Group onChange={handleModeChange} value={mode}>
              <Radio value='quick'>{formatMessage({id: 'train.quick'})}</Radio>
              <Radio value='performance'>{formatMessage({id: 'train.performance'})}</Radio>
              <Radio value='minimal'>{formatMessage({id: 'train.minimal'})}</Radio>
            </Radio.Group>
          </dd>
        </dl>
      </div>
      <div className={styles.advanced}>
        <dl>
          <dt>{formatMessage({id: 'train.dataAllot'})}</dt>
        </dl>
        <Card title={analysisTitle} style={{ width: '80%'}}>
          <div>
            {getAnalysisContent()}
          </div>
        </Card>
        <dl>
          <dt>{formatMessage({ id: 'train.datetimeCol' })}
            {makeToolTipFromMsgId('train.hintDatetimeSeriesFeature')}
          </dt>
          <dd>
            <Select placeholder={handleDatetimeSelectorPlaceholder()} style={{ width: 300 }} disabled={datetimeColArr.length === 0} onChange={handleDateChange}>
              {
                datetimeColArr && datetimeColArr.map((item, index) => {
                  return (
                    <Option value={item.name} key={index}>{item.name}</Option>
                  )
                })
              }
            </Select>
          </dd>
        </dl>
      </div>
    </Form>
  )
}
export default withRouter(connect(({ dataset, train }) => (
  { dataset, train }
))(Train));
