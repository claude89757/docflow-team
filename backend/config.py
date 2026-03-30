"""全局配置常量"""

# 模型定价 (USD per million tokens)
MODEL_PRICING = {
    "input_price_per_mtok": 3.0,  # Claude 3.5 Sonnet input
    "output_price_per_mtok": 15.0,  # Claude 3.5 Sonnet output
    "model_name": "claude-sonnet-4-20250514",
}

# 模型上下文窗口
CONTEXT_WINDOW_MAX = 200_000  # tokens

# 数据库路径
DB_PATH = "data/docflow.db"
