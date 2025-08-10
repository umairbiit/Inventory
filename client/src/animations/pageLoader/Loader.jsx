import loadingAnimation from "./loadingAnimation.json";
import Lottie from "react-lottie";

export function Loader({ isLoading }) {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
            pointerEvents: "auto",
          }}
        >
          <Lottie options={defaultOptions} height={250} width={250} />
        </div>
      )}
    </>
  );
}
