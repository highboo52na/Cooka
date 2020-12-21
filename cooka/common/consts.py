from os import path as P

from traitlets.config import Application
from traitlets.traitlets import (
    Bool, Unicode, Integer, List, Dict
)


# -- Load config
class CookaApp(Application):
    server_port = Integer(8240).tag(config=True)
    language = Unicode("en_US").tag(config=True)
    data_directory = Unicode("~/cooka").tag(config=True)
    notebook_portal = Unicode("http://localhost:8888").tag(config=True)
    optimize_metric = Dict(
        per_key_traits={
            "multi_classification_optimize": Unicode("accuracy").tag(config=True),
            "binary_classification": Unicode("auc").tag(config=True),
            "regression": Unicode("rmse").tag(config=True)
        }
    ).tag(config=True)

    max_trails = Dict(
        per_key_traits={
            "performance": Integer(50),
            "quick": Integer(10),
            "minimal": Integer(1)
        }
    ).tag(config=True)


_config_dir = P.expanduser("~/.config/cooka")
_config_name = 'cooka.py'
_config_path = P.join(_config_dir, _config_name)
_app = CookaApp()
if P.exists(_config_path):
    _app.load_config_file(_config_name, path=[_config_dir])

DATA_DIR = P.expanduser(_app.data_directory)
NOTEBOOK_PORTAL = _app.notebook_portal
LANG = _app.language

TASK_TYPE_OPTIMIZE_METRIC_MAPPING = {
    "multi_classification": "accuracy",
    "binary_classification": "auc",
    "regression": "rmse"
}
TRAIN_MODE_MAX_TRAILS_MAPPING = {
    "performance": 50,
    "quick": 10,
    "minimal": 1
}
SERVER_PORT = _app.server_port


# ---
CODE_SUCCESS = 0

CODE_ILLEGAL_PARAM = 600

CODE_ASSERTION_ERROR = 601
CODE_MISSING_PARAM = 602
ENTITY_NOT_EXISTS = 603
CODE_HTTP_ERROR = 604
CODE_NOT_FILE = 605

CODE_OTHER = -1

# ---
BATCH_PREDICTION_COL = "prediction"

# ---
PATH_DATASET = P.join(DATA_DIR, 'dataset')
PATH_TEMPORARY_DATASET = P.join(DATA_DIR, 'temporary_dataset')

FIELD_TMP = 'tmp'
FIELD_UPLOAD = 'upload'
FIELD_EXPERIMENT = 'experiments'

PATH_TMP = P.join(DATA_DIR, FIELD_TMP)
PATH_TMP_UPLOAD = P.join(DATA_DIR, FIELD_TMP, FIELD_UPLOAD)
PATH_TMP_PREDICT = P.join(DATA_DIR, FIELD_TMP, 'predict')

PATH_TMP_LOG = P.join(DATA_DIR, FIELD_TMP, 'log')
PATH_CONFIG_UPLOAD = P.join(DATA_DIR, FIELD_TMP, 'config')
PATH_DATABASE = P.join(DATA_DIR, "cooka.sqlite")
# if not P.exists(DATA_DIR):
#     os.makedirs(DATA_DIR)

PATH_INSTALL_HOME = P.dirname(P.dirname(P.dirname(P.abspath(__file__))))
SERVER_PORTAL = f"http://localhost:{SERVER_PORT}"


# --- Metric
METRIC_AUC = "auc"
METRIC_ACCURACY = "accuracy"
METRIC_ROOT_MEAN_SQUARED_ERROR = "rmse"

METRICS_DT_OPTIMIZE_MAPPING = {
    METRIC_AUC: "AUC",
    METRIC_ACCURACY: "accuracy",
    METRIC_ROOT_MEAN_SQUARED_ERROR: "RootMeanSquaredError"
}

METRICS_GBM_OPTIMIZE_MAPPING = {
    METRIC_AUC: "auc",
    METRIC_ACCURACY: "accuracy",
    METRIC_ROOT_MEAN_SQUARED_ERROR: "rmse"
}