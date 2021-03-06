# Cooka
[![Python Versions](https://img.shields.io/pypi/pyversions/hypergbm.svg)](https://pypi.org/project/hypergbm)
[![Downloads](https://pepy.tech/badge/hypergbm)](https://pepy.tech/project/hypergbm)
[![PyPI Version](https://img.shields.io/pypi/v/hypergbm.svg)](https://pypi.org/project/hypergbm)
[中文](README_zh_CN.md)

Cooka是一个轻量级、可视化的自动机器学习工具，可以通过Web UI管理数据集和设计建模实验，
并使用[DeepTables](https://github.com/DataCanvasIO/DeepTables) 和[HyperGBM](https://github.com/DataCanvasIO/HyperGBM)
执行，从而自动进行特征工程、算法超参数调优和神经网络架构搜索。

<img src="docs/img/datacanvas_automl_toolkit.png" alt="drawing" width="700" height="450"/>

## 功能概览  
通过Cooka提供的Web UI可以：

- 添加、分析数据集
- 设计建模实验
- 查看实验过程和结果
- 使用模型
- 建模过程导出成Jupyter Notebook

Web页面截图：
<table style="border: none">
    <th><img src="docs/img/cooka_home_page.png" width="500"/></th>
    <th><img src="docs/img/cooka_train.gif" width="500"/></th>
</table>

建模支持的算法有：
- XGBoost
- LightGBM
- Catboost

建模支持的神经网络有：
- WideDeep
- DeepFM
- xDeepFM
- AutoInt
- DCN
- FGCNN 
- FiBiNet
- PNN
- AFM
- [...](https://deeptables.readthedocs.io/en/latest/models.html)


搜索支持的算法有：
- 强化学习
- 蒙特卡洛树搜索
- [...](https://github.com/DataCanvasIO/HyperGBM)

支持由[scikit-learn](https://scikit-learn.org) 和[featuretools](https://github.com/alteryx/featuretools) 提供的特征工程：

- 缩放
    - StandardScaler
    - MinMaxScaler
    - RobustScaler
    - MaxAbsScaler
    - Normalizer
   
- 编码
    - LabelEncoder
    - OneHotEncoder
    - OrdinalEncoder

- 离散化
    - KBinsDiscretizer
    - Binarizer

- 降维
    - PCA

- 特征衍生
    - featuretools

- 缺失值填充
    - SimpleImputer 

还以可以通过扩展搜索空间支持更多的特征工程方法和建模算法。

## 安装 

需要python版本不低于3.6，对于centos安装系统依赖包：
```shell script
sudo yum install -y gcc gcc-c++ graphviz
```

对于ubuntu：
```shell script
sudo apt-get update
sudo apt-get install -y gcc gcc-c++ graphviz
```

从[PYPI](https://pypi.org)中安装Cooka:
```shell script
pip install cooka
```

从源码构建还需要 [node>=8.0.0](https://nodejs.org/en/),
```shell script
python setup.py install
```

启动Web服务：
```shell script
cooka server
```
然后使用浏览器访问`http://<server:8140>`来使用Cooka。

Cooka配置文件默认在`~/.config/cooka/cooka.py`，生成配置文件模板：

```shell script
cooka --generate-config > ~/.config/cooka/cooka.py
```


## DataCanvas

![](docs/img/dc_logo_1.png)

Cooka is an open source project created by [DataCanvas](https://www.datacanvas.com/). 


