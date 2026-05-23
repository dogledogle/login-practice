type ToastProps = {
  message: string;
};

// 轻量级全局提示，只在有消息时渲染，关闭时机由 App 统一控制。
export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
