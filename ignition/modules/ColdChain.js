import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ColdChainModule", (m) => {
  const coldChain = m.contract("ColdChain");

  return { coldChain };
});
