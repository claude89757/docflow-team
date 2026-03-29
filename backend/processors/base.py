from typing import Protocol


class DocumentProcessor(Protocol):
    """文档处理器接口"""

    def parse(self, file_path: str) -> dict:
        """解析文档，返回结构化内容"""
        ...

    def extract_text(self, file_path: str) -> str:
        """提取纯文本内容"""
        ...

    def apply_changes(self, file_path: str, changes: list[dict]) -> str:
        """应用格式修改指令，返回输出文件路径"""
        ...

    def get_stats(self, file_path: str) -> dict:
        """获取文档统计信息（段落数、字数等）"""
        ...
