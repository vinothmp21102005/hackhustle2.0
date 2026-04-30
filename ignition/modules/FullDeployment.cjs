const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ChainDeployment", (m) => {
  // 1. Deploy the ColdChain contract (Simple version for Hackathon)
  const coldChain = m.contract("ColdChain", []);

  return { coldChain };
});
