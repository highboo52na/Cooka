import React, { useState, useEffect } from 'react';
import { Form, Input, Card, Radio, Slider, InputNumber, Row, Col, Upload, message, Spin, Tooltip, Icon } from 'antd';
import { InboxOutlined, QuestionCircleOutlined, CheckOutlined, LoadingOutlined, MinusOutlined, CloseOutlined } from '@ant-design/icons';
import { connect } from 'dva';
import { withRouter } from 'umi';
import styles from '../index.less';
import { formatMessage } from 'umi-plugin-locale';
import { ConvertByteUnits } from '@/utils/util';
import {makeSampleDiv, makeCsvFileTip} from '@/pages/common/createDataset'

const { Dragger } = Upload;
const antIcon = <LoadingOutlined style={{ fontSize: 16 }} spin />;
const statusConfig = {
  todo: (<MinusOutlined style={{ fontSize: 16, color: '#000'}}/>),
  doing: (<Spin indicator={antIcon} />),
  done: (<CheckOutlined style={{ fontSize: 16, color: 'green'}} />),
  undone: (<CloseOutlined style={{ fontSize: 16, color: 'red'}} />)
};


const StepType = {
  upload: 'upload',
  load:'load',
  analyze: 'analyzed',
};

/**
 * 将分析任务详情的接口返回的数据包装成 k-v形式，例如：
 * {
 *   upload: {
 *     extension: {
 *       file_size: "10KB"
 *     },
 *     took: 100
 *   }
 * }
 * @param responseData
 */
function parseStepProcess(responseData) {
  const result = {};
  for (var step of responseData.steps){
    result[step.type] = step;
  }
  return result;
}

const Uploadpage = ({ dispatch, location,  uploadFile: { responseData }}) => {
  const [form] = Form.useForm();
  const [sampleStrategy, setSampleStrategy] = useState('whole_data'); // 抽样分析类型
  const [value, setValue] = useState(50); // 抽样分析value值
  const [fileName, setFileName] = useState(null);  // 设置文件上传headers里面的filename
  const [uploadStatus, setUploadStatus] = useState(statusConfig['todo']);  // 上传icon状态
  const [loadingDataStatus, setLoadingDataStatus] = useState(statusConfig['todo']); // 加载数据icon状态
  const [analysisDataStatus, setAnalysisDataStatus] = useState(statusConfig['todo']); // 分析数据icon状态
  const [uploadTips, setUploadTips] = useState(formatMessage({id: 'upload.prepare'})); // 上传文件提示
  const [loadingDataTips, setLoadingDataTips] = useState(formatMessage({id: 'upload.prepare'})); // 加载数据提示
  const [analysisDataTips, setAnalysisDataTips] = useState(formatMessage({id: 'upload.prepare'})); // 分析数据提示

  useEffect(() => {

    if(responseData !== null && responseData !== undefined){
      const stepsObject = parseStepProcess(responseData);
      const uploadStep = stepsObject[StepType.upload];

      if(uploadStep !== undefined && uploadStep !== null){
        // 处理上传步骤
        if(uploadStep.status === 'succeed'){
          setUploadStatus(statusConfig.done);
          setUploadTips(`${formatMessage({id: 'upload.hintUploadFile'}, {elapsed: uploadStep.took.toFixed(2), fileSize: ConvertByteUnits(uploadStep.extension.file_size)})}`);

          setLoadingDataStatus(statusConfig.doing);  // 下一个步骤置为运行中
          setLoadingDataTips(formatMessage({id: 'upload.loading'}));

        }else{
            // todo
        }
      }

      const loadStep = stepsObject[StepType.load];

      if (loadStep !== undefined && loadStep !== null) {
        if(loadStep.status === 'succeed'){
          const n_rows = loadStep['extension']['n_rows'];
          const n_cols = loadStep['extension']['n_cols'];
          const n_rows_used = loadStep['extension']['n_rows_used'];
          const loadingTook = loadStep['took'];

          setLoadingDataStatus(statusConfig['done']);
          setLoadingDataTips(formatMessage({id: 'upload.hintLoadData'}, {elapsed: loadingTook.toFixed(2), nRows: n_rows, nColumns: n_cols, nRowsUsed: n_rows_used}) );

          setAnalysisDataStatus(statusConfig['doing']);
          setAnalysisDataTips(formatMessage({id: 'upload.analysising'}));

        }else{
          setLoadingDataStatus(statusConfig['undone']);
          setLoadingDataTips(formatMessage({id: 'upload.fail'}))
        }
      }

      const analyzeStep = stepsObject[StepType.analyze];

      if(analyzeStep !== undefined && analyzeStep !== null){
        if (analyzeStep.status === 'succeed') {
          setAnalysisDataStatus(statusConfig['done']);
          setLoadingDataStatus(statusConfig['done']);
          // setAnalysisDataTips(`${formatMessage({id: 'upload.spend'})}${analysisTook}s，${formatMessage({id: 'upload.result'})}${continuous}${formatMessage({id: 'upload.rows'})}，${formatMessage({id: 'upload.category'})}${categorical}${formatMessage({id: 'upload.rows'})}，${formatMessage({id: 'upload.time'})}${datetime}${formatMessage({id: 'upload.rows'})}`);
          setAnalysisDataTips(`${formatMessage({id: 'upload.hintAnalysis'}, {elapsed: analyzeStep.took.toFixed(2), nContinuous: analyzeStep.extension.feature_summary.continuous, nCategorical: analyzeStep.extension.feature_summary.categorical,  nDatetime: analyzeStep.extension.feature_summary.datetime})}`);
        } else if (analyzeStep.status === 'failed') {
          setAnalysisDataStatus(statusConfig['undone']);
          setAnalysisDataTips(formatMessage({id: 'upload.fail'}));
        }
      }
    }
  },[responseData]);



  const onChange = value => {
    if (isNaN(value)) {
      return;
    }
    setValue(value);
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv, .tsv',
    headers: {
      'File-Name': fileName,
    },
    action: '/api/resource',
    beforeUpload: (file) => {
      if (file.size > 128 * 1000000) {
        message.warning(formatMessage({id: 'upload.big'}));
        return false;
      }
      setFileName(file.name);
    },
    showUploadList: false,
    onChange(info) {
      const { status } = info.file;
      if (status === 'uploading') {
        setUploadStatus(statusConfig['doing']);
        setUploadTips(formatMessage({id: 'upload.uploading'}));
      }
      if (status === 'done') {  // 上传成功
        // setUploadStatus(statusConfig['done']);
        // setUploadTips(`${formatMessage({id: 'upload.hintUploadFile'}, {elapsed: info.file.response.data.took, fileSize: info.file.response.data.size }) }`)
        // setLoadingDataStatus(statusConfig['doing']);
        // setLoadingDataTips(formatMessage({id: 'upload.loading'}));
        const filePath = info.file.response.data.path;
        const uploadTook = info.file.response.data.took;
        const text = sampleStrategy === 'random_rows' ? {
          n_rows: form.getFieldsValue().n_rows
        }: {
          percentage: value
        };
        const sourceType = location.query.sourceType;
        // 创建临时数据集
        dispatch({
          type: 'uploadFile/createTempDataset',
          payload: {
            sample_strategy:sampleStrategy,
            ...text,
            file_path: filePath,
            upload_took: uploadTook,
            source_type: sourceType,
          }
        });
        // using backend response instead
        // if (step2Status === 'succeed') {
        //   setLoadingDataStatus(statusConfig['done']);
        // }
        // message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        setUploadStatus(statusConfig['undone']);
        setUploadTips(formatMessage({id: 'upload.uploadFail'}));
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <>
      <div className={styles.main}>
          {makeSampleDiv(setSampleStrategy, sampleStrategy, form, onChange, value)}

          <div className={styles.fileUpload}>
            <dl>
              <dt>{formatMessage({id: 'upload.upload'})}</dt>
              {makeCsvFileTip()}
            </dl>

            <Dragger {...uploadProps} style={{ width: '85%'}}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{formatMessage({id: 'upload.uploadBox'})}</p>
            </Dragger>

          </div>
        </div>
        <div className={styles.process}>
          <dl>
            <dt>
              { uploadStatus }
              <span className={styles.stepTitle}>1. {formatMessage({id: 'upload.uploadStep'})}</span>
            </dt>
            <dd className={styles.stepTips}>{ uploadTips }</dd>
          </dl>
          <dl>
            <dt>
              { loadingDataStatus }
              <span className={styles.stepTitle}>2. {formatMessage({id: 'upload.loadData'})}</span>
            </dt>
            <dd className={styles.stepTips}>{ loadingDataTips }</dd>
          </dl>
          <dl>
            <dt>
              { analysisDataStatus }
              <span className={styles.stepTitle}>3. {formatMessage({id: 'upload.analysisData'})}</span>
            </dt>
            <dd className={styles.stepTips}>{ analysisDataTips }</dd>
          </dl>
        </div>
    </>
  )
}
export default withRouter(connect(({ uploadFile }) => (
  { uploadFile }
))(Uploadpage));
