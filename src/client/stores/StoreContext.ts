import { createContext, useContext } from 'react';
import { RegistrationStore } from './RegistrationStore';

/**
 * A single shared instance for the lifetime of the app.
 * If you need a fresh store per page/session, create it inside a component instead.
 */
const store = new RegistrationStore();

const StoreContext = createContext<RegistrationStore>(store);

/** Drop into any component that needs the registration store. */
export function useRegistrationStore(): RegistrationStore {
  return useContext(StoreContext);
}

/**
 * Wrap your multi-step form (or the whole app) with this provider.
 * Children receive the same store instance.
 */
export { StoreContext };
export default store;
