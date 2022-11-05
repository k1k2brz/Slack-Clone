import { Dispatch, SetStateAction, useCallback, useState } from 'react';

// https://bobbyhadz.com/blog/react-parameter-event-implicitly-has-an-any-type
// 출처

type Handler = (e: React.ChangeEvent<HTMLInputElement>) => void;
type ReturnTypes<T> = [T, Handler, Dispatch<SetStateAction<T>>];
const useInput = <T>(initialValue: T): ReturnTypes<T> => {
  const [value, setValue] = useState(initialValue);
  const handler = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value as unknown as T);
  }, []);
  return [value, handler, setValue];
};

export default useInput;
