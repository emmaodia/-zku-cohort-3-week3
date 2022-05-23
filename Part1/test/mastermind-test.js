const chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect; // Using Assert style
const path = require("path");
const F1Field = require("ffjavascript").F1Field;
// const Fr = new F1Field(exports.p);

const wasm_tester = require("circom_tester").wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;

describe("Mastermind KIDS", function () {
  let poseidon, circuit, F;

  async function calculateWitness(tc) {
    return await circuit.calculateWitness(
      {
        pubGuessA: tc.guess[0],
        pubGuessB: tc.guess[1],
        pubGuessC: tc.guess[2],
        pubNumHit: tc.hit_blow[0],
        pubNumBlow: tc.hit_blow[1],
        pubSolnHash: tc.solHash,
        privSolnA: tc.sol[0],
        privSolnB: tc.sol[1],
        privSolnC: tc.sol[2],
        privSalt: tc.salt,
      },
      true
    );
  }

  before(async () => {
    poseidon = await buildPoseidon();
    F = poseidon.F;
    circuit = await wasm_tester(
      path.join(__dirname, "../contracts/circuits/MastermindVariation.circom")
    );
  });

  const testCases = [
    {
      name: "3 hits",
      guess: [1, 2, 3],
      sol: [1, 2, 3],
      hit_blow: [3, 0],
      solHash:
        21382988951546277963376563423414913801931043068020802929528949297947265028048n,
      salt: 9,
    },
    {
      name: "1 hit and 2 blows",
      guess: [2, 1, 3],
      sol: [1, 2, 3],
      hit_blow: [1, 2],
      solHash:
        21382988951546277963376563423414913801931043068020802929528949297947265028048n,
      salt: 9,
    },
    {
      name: "No hits, no blows",
      guess: [4, 5, 0],
      sol: [1, 2, 3],
      hit_blow: [0, 0],
      solHash:
        21382988951546277963376563423414913801931043068020802929528949297947265028048n,
      salt: 9,
    },
  ];

  testCases.forEach((tc, i) => {
    it("test case " + (i + 1) + ": " + tc.name, async () => {
      const witness = await calculateWitness(tc);
      await circuit.assertOut(witness, { solnHashOut: tc.solHash });
      await circuit.checkConstraints(witness);
    });
  });

  it("should fail when input color bigger than 5", async () => {
    await expect(
      calculateWitness({
        guess: [4, 5, 6],
        sol: [1, 2, 3],
        hit_blow: [0, 0],
        solHash:
          21382988951546277963376563423414913801931043068020802929528949297947265028048n,
        salt: 9,
      })
    ).to.be.rejectedWith(/Assert Failed. Error in template/);
  });

  it("should fail when input is invalid", async () => {
    await expect(
      calculateWitness({
        guess: [],
        sol: [1, 2, 3],
        hit_blow: [0, 0],
        solHash:
          21382988951546277963376563423414913801931043068020802929528949297947265028048n,
        salt: 9,
      })
    ).to.be.rejectedWith(/Cannot convert undefined to a BigInt/);
  });

  it("should fail when hits or blows are wrong", async () => {
    await expect(
      calculateWitness({
        guess: [1, 2, 3],
        sol: [1, 2, 3],
        hit_blow: [0, 0],
        solHash:
          21382988951546277963376563423414913801931043068020802929528949297947265028048n,
        salt: 9,
      })
    ).to.be.rejectedWith(/Assert Failed. Error in template/);
  });
});