module.exports = {
  theme: {
    extend: {
      keyframes: {
        "moving-banner": {
          from: { backgroundPosition: "0% 0" },
          to: { backgroundPosition: "100% 0" },
        },
      },
      animation: {
        "moving-banner": "moving-banner 20s linear infinite",
      },
    },
  },
};
