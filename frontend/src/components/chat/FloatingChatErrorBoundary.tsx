import { Component, ReactNode } from "react";

type FloatingChatErrorBoundaryProps = {
  children: ReactNode;
};

type FloatingChatErrorBoundaryState = {
  hasError: boolean;
};

export default class FloatingChatErrorBoundary extends Component<
  FloatingChatErrorBoundaryProps,
  FloatingChatErrorBoundaryState
> {
  state: FloatingChatErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 z-40 max-w-[320px] rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm leading-6 text-red-600 shadow-[0_20px_60px_rgba(28,25,23,0.18)] sm:bottom-8 sm:right-8">
          채팅 화면을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
        </div>
      );
    }

    return this.props.children;
  }
}
