// @flow

export interface Store<S> {
  getState: () => S;
  putState: (s: S) => void;
}

export const createStore = <S>(
  initialState: S,
  onUpdate: (prevState: S) => void
): Store<S> => {
  let state = initialState;

  const getState = () => state;
  const putState = (s: S) => {
    const previousState = state;
    state = s;
    onUpdate(previousState);
  };

  return { getState, putState };
};
