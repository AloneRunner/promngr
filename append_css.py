
import os

path = r"c:\Users\kaano\OneDrive\Desktop\10\index.css"
content = """
.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
"""
with open(path, "a", encoding="utf-8") as f:
    f.write(content)
