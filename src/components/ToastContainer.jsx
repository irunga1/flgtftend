import { useToast } from '../context/ToastContext';

const TYPE_MAP = {
  success: { cls: 'bg-success', icon: '✓' },
  error:   { cls: 'bg-danger',  icon: '✕' },
  warning: { cls: 'bg-warning text-dark', icon: '⚠' },
  info:    { cls: 'bg-primary', icon: 'ℹ' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      class="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999 }}
    >
      {toasts.map((t) => {
        const { cls, icon } = TYPE_MAP[t.type] || TYPE_MAP.info;
        return (
          <div
            key={t.id}
            class={`toast show align-items-center text-white ${cls} border-0 mb-2`}
            role="alert"
          >
            <div class="d-flex">
              <div class="toast-body d-flex align-items-center gap-2">
                <span>{icon}</span>
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                class="btn-close btn-close-white me-2 m-auto"
                onClick={() => removeToast(t.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
