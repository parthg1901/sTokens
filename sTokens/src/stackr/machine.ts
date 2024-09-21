import { StateMachine } from "@stackr/sdk/machine";

import * as genesisState from "../../genesis-state.json";
import { StokenState } from "./state";
import { transitions } from "./transitions";

const stokenMachine = new StateMachine({
  id: "sTokens",
  stateClass: StokenState,
  initialState: genesisState.state,
  on: transitions,
});

export { stokenMachine };
