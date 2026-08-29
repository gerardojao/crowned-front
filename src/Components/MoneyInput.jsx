import { useEffect, useRef, useState } from "react";
import { formatSpanishMoney, parseSpanishMoney } from "../utils/currency";

export default function MoneyInput({ value, onChange, className = "", placeholder = "0,00" }) {
  const [text, setText] = useState(() => formatSpanishMoney(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(formatSpanishMoney(value));
  }, [value]);

  const commit = () => {
    focusedRef.current = false;
    const number = parseSpanishMoney(text);
    setText(formatSpanishMoney(number));
    onChange?.(number);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={(event) => {
        focusedRef.current = true;
        event.currentTarget.select();
      }}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={className}
      placeholder={placeholder}
      aria-label="Importe"
    />
  );
}
