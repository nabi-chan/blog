import { c as e, j as s, u as O, a as ae, b as P, d as D, B as K, e as le, H as T, N as B, f as oe } from "./index-5e68f89b.mjs";
const ne = ({
  shiftY: l,
  footerBgColorClass: n = "bg-white dark:bg-black",
  contentBgColorClass: i = "bg-white dark:bg-black",
  height: c = 96,
  children: m
}) => {
  const f = e(
    "w-100 sticky bottom-[-24px] z-[297] m-0 box-border p-0"
  ), w = l ? `calc(${l} - 24px)` : "-24px", x = `${c + 24}px`, u = e(
    "sticky z-[298] block h-[24px]",
    i
  ), g = "0", h = e(
    "sticky z-[299] mb-[-24px] flex items-center justify-between",
    "h-[96px]",
    n
  ), p = "0", k = `${c}px`, j = "sticky mx-2 block h-[24px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,.025),0_-8px_16px_-3px_rgba(0,0,0,.08)]", N = l ? `calc(${l} + ${c - 24}px)` : `${c - 24}px`;
  return /* @__PURE__ */ s.jsxs(
    "div",
    {
      className: f,
      style: {
        bottom: w,
        height: x
      },
      children: [
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: u,
            style: {
              bottom: g
            }
          }
        ),
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: h,
            style: {
              bottom: p,
              height: k
            },
            children: m
          }
        ),
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: j,
            style: {
              bottom: N
            }
          }
        )
      ]
    }
  );
};
function F(l, n, i = {}) {
  l ? B.show(de, {
    title: "Are you sure you want to leave this page?",
    prompt: /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsx("p", { children: "Hey there! It looks like you didn't save the changes you made." }),
      /* @__PURE__ */ s.jsx("p", { children: "Save before you go!" })
    ] }),
    okLabel: "Leave",
    cancelLabel: "Stay",
    okColor: "red",
    onOk: (c) => {
      n(), c == null || c.remove();
    },
    ...i
  }) : n();
}
const ie = "bg-[rgba(98,109,121,0.2)] backdrop-blur-[3px]", U = ({
  size: l = "md",
  width: n,
  height: i,
  testId: c,
  title: m,
  okLabel: f = "OK",
  okLoading: w = !1,
  cancelLabel: x = "Cancel",
  footer: u,
  header: g,
  leftButtonProps: h,
  buttonsDisabled: p,
  okDisabled: k,
  padding: j = !0,
  onOk: N,
  okColor: W = "black",
  onCancel: C,
  topRightContent: v,
  hideXOnMobile: X = !1,
  afterClose: E,
  children: q,
  backDrop: J = !0,
  backDropClick: Q = !0,
  stickyFooter: z = !1,
  stickyHeader: R = !1,
  scrolling: V = !0,
  dirty: M = !1,
  animate: Z = !0,
  formSheet: A = !1,
  enableCMDS: Y = !0
}) => {
  const H = O(), { setGlobalDirtyState: I } = ae(), [G, ee] = P(!1);
  D(() => {
    I(M);
  }, [M, I]), D(() => {
    const r = (b) => {
      b.key === "Escape" && (document.activeElement && document.activeElement instanceof HTMLElement && document.activeElement.blur(), setTimeout(() => {
        C ? C() : F(M, () => {
          H.remove(), E == null || E();
        });
      }), b.stopPropagation());
    };
    return document.addEventListener("keydown", r), () => {
      document.removeEventListener("keydown", r);
    };
  }, [H, M, E, C]), D(() => {
    const r = setTimeout(() => {
      ee(!0);
    }, 250);
    return () => clearTimeout(r);
  }, []), D(() => {
    if (N) {
      const r = (b) => {
        (b.metaKey || b.ctrlKey) && b.key === "s" && (b.preventDefault(), N());
      };
      if (Y)
        return window.addEventListener("keydown", r), () => {
          window.removeEventListener("keydown", r);
        };
    }
  });
  const _ = [];
  let L;
  const S = () => {
    F(M, () => {
      H.remove(), E == null || E();
    });
  };
  u || (x && _.push({
    key: "cancel-modal",
    label: x,
    color: "outline",
    onClick: C || (() => {
      S();
    }),
    disabled: p
  }), f && _.push({
    key: "ok-modal",
    label: f,
    color: W,
    className: "min-w-[80px]",
    onClick: N,
    disabled: p || k,
    loading: w
  }));
  let a = e(
    "relative z-50 mx-auto flex max-h-[100%] w-full flex-col justify-between overflow-x-hidden bg-white dark:bg-black",
    l !== "bleed" && "rounded",
    A ? "shadow-md" : "shadow-xl",
    Z && !A && !G && "animate-modal-in",
    A && !G && "animate-modal-in-reverse",
    V ? "overflow-y-auto" : "overflow-y-hidden"
  ), o = e(
    "fixed inset-0 z-[1000] h-[100vh] w-[100vw]"
  ), d = "", t = e(
    !v || v === "close" ? "" : "flex items-center justify-between gap-5"
  );
  switch (R && (t = e(
    t,
    "sticky top-0 z-[200] -mb-4 bg-white !pb-4 dark:bg-black"
  )), l) {
    case "sm":
      a = e(
        a,
        "max-w-[480px]"
      ), o = e(
        o,
        "p-4 md:p-[8vmin]"
      ), d = "p-8", t = e(
        t,
        "-inset-x-8"
      );
      break;
    case "md":
      a = e(
        a,
        "max-w-[720px]"
      ), o = e(
        o,
        "p-4 md:p-[8vmin]"
      ), d = "p-8", t = e(
        t,
        "-inset-x-8"
      );
      break;
    case "lg":
      a = e(
        a,
        "max-w-[1020px]"
      ), o = e(
        o,
        "p-4 md:p-[4vmin]"
      ), d = "p-7", t = e(
        t,
        "-inset-x-8"
      );
      break;
    case "xl":
      a = e(
        a,
        "max-w-[1240px]0"
      ), o = e(
        o,
        "p-4 md:p-[3vmin]"
      ), d = "p-10", t = e(
        t,
        "-inset-x-10 -top-10"
      );
      break;
    case "full":
      a = e(
        a,
        "h-full"
      ), o = e(
        o,
        "p-4 md:p-[3vmin]"
      ), d = "p-10", t = e(
        t,
        "-inset-x-10"
      );
      break;
    case "bleed":
      a = e(
        a,
        "h-full"
      ), d = "p-10", t = e(
        t,
        "-inset-x-10"
      );
      break;
    default:
      o = e(
        o,
        "p-4 md:p-[8vmin]"
      ), d = "p-8", t = e(
        t,
        "-inset-x-8"
      );
      break;
  }
  j || (d = "p-0"), a = e(
    a
  ), t = e(
    t,
    d,
    "pb-0"
  ), L = e(
    d,
    "py-0"
  ), o = e(
    o,
    "max-[800px]:!pb-20"
  );
  const se = e(
    `${d} ${z ? "py-6" : ""}`,
    "flex w-full items-center justify-between"
  );
  L = e(
    L,
    (l === "full" || l === "bleed" || i === "full" || typeof i == "number") && "grow"
  );
  const te = (r) => {
    r.target === r.currentTarget && Q && S();
  }, $ = {};
  typeof n == "number" ? ($.width = "100%", $.maxWidth = n + "px") : n === "full" && (a = e(
    a,
    "w-full"
  )), typeof i == "number" ? ($.height = "100%", $.maxHeight = i + "px") : i === "full" && (a = e(
    a,
    "h-full"
  ));
  let y;
  return u ? y = u : u === !1 ? L += " pb-0 " : y = /* @__PURE__ */ s.jsxs("div", { className: se, children: [
    /* @__PURE__ */ s.jsx("div", { children: h && /* @__PURE__ */ s.jsx(K, { ...h }) }),
    /* @__PURE__ */ s.jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ s.jsx(le, { buttons: _ }) })
  ] }), y = z ? /* @__PURE__ */ s.jsx(ne, { height: 84, children: y }) : /* @__PURE__ */ s.jsx(s.Fragment, { children: y }), /* @__PURE__ */ s.jsxs("div", { className: o, id: "modal-backdrop", onMouseDown: te, children: [
    /* @__PURE__ */ s.jsx("div", { className: e(
      "pointer-events-none fixed inset-0 z-0",
      J && !A && ie,
      A && "bg-[rgba(98,109,121,0.08)]"
    ) }),
    /* @__PURE__ */ s.jsxs("section", { className: a, "data-testid": c, style: $, children: [
      g === !1 ? "" : !v || v === "close" ? /* @__PURE__ */ s.jsxs("header", { className: t, children: [
        m && /* @__PURE__ */ s.jsx(T, { level: 3, children: m }),
        /* @__PURE__ */ s.jsx("div", { className: `${v !== "close" && "md:!invisible md:!hidden"} ${X && "hidden"} absolute right-6 top-6`, children: /* @__PURE__ */ s.jsx(K, { className: "-m-2 cursor-pointer p-2 opacity-50 hover:opacity-100", icon: "close", iconColorClass: "text-black dark:text-white", size: "sm", testId: "close-modal", unstyled: !0, onClick: S }) })
      ] }) : /* @__PURE__ */ s.jsxs("header", { className: t, children: [
        m && /* @__PURE__ */ s.jsx(T, { level: 3, children: m }),
        v
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: L, children: q }),
      y
    ] })
  ] });
}, ce = ({
  title: l = "Are you sure?",
  prompt: n,
  cancelLabel: i = "Cancel",
  okLabel: c = "OK",
  okRunningLabel: m = "...",
  okColor: f = "black",
  onCancel: w,
  onOk: x,
  customFooter: u,
  formSheet: g = !0
}) => {
  const h = O(), [p, k] = P("");
  return /* @__PURE__ */ s.jsx(
    U,
    {
      backDropClick: !1,
      buttonsDisabled: p === "running",
      cancelLabel: i,
      footer: u,
      formSheet: g,
      okColor: f,
      okLabel: p === "running" ? m : c,
      testId: "confirmation-modal",
      title: l,
      width: 540,
      onCancel: w,
      onOk: async () => {
        k("running");
        try {
          await (x == null ? void 0 : x(h));
        } catch (j) {
          console.error("Unhandled Promise Rejection. Make sure you catch errors in your onOk handler.", j);
        }
        k("");
      },
      children: /* @__PURE__ */ s.jsx("div", { className: "py-4 leading-9", children: n })
    }
  );
}, de = B.create(ce), re = B.create(() => {
  const { updateRoute: l } = oe(), n = B.useModal();
  return /* @__PURE__ */ s.jsx(
    U,
    {
      afterClose: () => {
        l("");
      },
      cancelLabel: "",
      okLabel: "Close",
      size: "sm",
      title: "About",
      onOk: () => {
        l(""), n.remove();
      },
      children: /* @__PURE__ */ s.jsxs("div", { className: "mt-3 flex flex-col gap-4", children: [
        /* @__PURE__ */ s.jsx("p", { children: "You're looking at a React app inside Ghost Admin. It uses common AdminX framework and Design System packages, and works seamlessly with the current Admin's routing." }),
        /* @__PURE__ */ s.jsx("p", { children: "At the moment the look and feel follows the current Admin's style to blend in with existing pages. However the system is built in a very flexible way to allow easy updates in the future." }),
        /* @__PURE__ */ s.jsx(T, { className: "-mb-2 mt-4", level: 5, children: "Contents" }),
        /* @__PURE__ */ s.jsxs("p", { children: [
          "The demo uses a mocked list of members — it's ",
          /* @__PURE__ */ s.jsx("strong", { children: "not" }),
          " ",
          "the actual or future design of members in Ghost Admin. Instead, the pages showcase common design patterns like a list and detail, navigation, modals and toasts."
        ] })
      ] })
    }
  );
}), ue = { DemoModal: re };
export {
  ue as default
};
//# sourceMappingURL=modals-f789a6c4.mjs.map
