import { useCtx } from '@/ctx';
import type { Modal } from '@/types/modal';

export const ModalWrapper = ({ children }: Modal) => {
  const { getColor } = useCtx();

  return (
    <box
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <scrollbox
        style={{
          width: '50%',
          maxWidth: 100,
          height: '40%',
          maxHeight: 35,
          backgroundColor: getColor('backgroundPanel'),
        }}
      >
        {children}
      </scrollbox>
    </box>
  );
};
