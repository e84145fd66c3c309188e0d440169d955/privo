import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PrivateKey,
  PublicKey,
  isReady,
  Encoding,
} from 'snarkyjs';

export { isReady, Field, Encoding };

// Wait till our SnarkyJS instance is ready
await isReady;

// These private keys are exported so that experimenting with the contract is
// easy. Three of them (the Bobs) are used when the contract is deployed to
// generate the public keys that are allowed to post new messages. Jack's key
// is never added to the contract. So he won't be able to add new messages. In
// real life, we would only use the Bobs' public keys to configure the contract,
// and only they would know their private keys.

export const users = {
  Alice: PrivateKey.fromBase58(
    'EKFAdBGSSXrBbaCVqy4YjwWHoGEnsqYRQTqz227Eb5bzMx2bWu3F'
  ),
  Bob: PrivateKey.fromBase58(
    'EKEitxmNYYMCyumtKr8xi1yPpY3Bq6RZTEQsozu2gGf44cNxowmg'
  ),
  Charlie: PrivateKey.fromBase58(
    'EKE9qUDcfqf6Gx9z6CNuuDYPe4XQQPzFBCfduck2X4PeFQJkhXtt'
  ), // This one says duck in it :)
  Relay: PrivateKey.fromBase58(
    'EKFS9v8wxyrrEGfec4HXycCC2nH7xf79PtQorLXXsut9WUrav4Nw'
  ),
};

export class Voting extends SmartContract {
  // On-chain state definitions
  @state(Field) voteHistoryHash = State<Field>();
  @state(Field) merkleTree = State<Field>();
  @state(PublicKey) user1 = State<PublicKey>();
  @state(PublicKey) user2 = State<PublicKey>();
  // @state(PublicKey) user3 = State<PublicKey>();
  @state(PublicKey) relayer = State<PublicKey>();

  @method init() {
    // Define initial values of on-chain state
    this.user1.set(users['Alice'].toPublicKey());
    this.user2.set(users['Bob'].toPublicKey());
    //   this.user3.set(users['Charlie'].toPublicKey());
    this.relayer.set(users['Relay'].toPublicKey());
    this.voteHistoryHash.set(Field.zero);
    this.merkleTree.set(Field.zero);
  }

  @method register(merkleTree: Field, signerPrivateKey: PrivateKey) {
    // Compute signerPublicKey from signerPrivateKey argument
    const signerPublicKey = signerPrivateKey.toPublicKey();

    // Get approved public keys
    const user1 = this.user1.get();
    const user2 = this.user2.get();
    //   const user3 = this.user3.get();

    // Assert that signerPublicKey is one of the approved public keys
    signerPublicKey
      .equals(user1)
      .or(signerPublicKey.equals(user2))
      //   .or(signerPublicKey.equals(user3))
      .assertEquals(true);

    // Void the user who registered to prevent re-registering
    switch (signerPublicKey) {
      case user1:
        this.user1.set(PublicKey.empty());
        break;
      case user2:
        this.user2.set(PublicKey.empty());
        break;
      // case user3:
      //     this.user3.set(PublicKey.empty());
      //     break;
      default:
        break;
    }

    // TODO: Push commitment to Merkle tree here
    // Compute new merkle tree hash off-chain and
    // push new merkle tree

    // Update on-chain merkle tree hash
    this.merkleTree.set(merkleTree);
  }

  @method publishVote(
    voteHistoryHash: Field,
    merkleTree: Field,
    signerPrivateKey: PrivateKey
  ) {
    // Compute signerPublicKey from signerPrivateKey argument
    const signerPublicKey = signerPrivateKey.toPublicKey();

    // Get approved public keys
    // Only relayer can publish vote
    const relayer = this.relayer.get();

    // Assert that signerPublicKey is one of the approved public keys
    signerPublicKey.equals(relayer).assertEquals(true);

    // Update on-chain voteHistoryHash
    this.voteHistoryHash.set(voteHistoryHash);

    // TODO: Push nullifier to Merkle tree here
    // Compute new merkle tree hash off-chain and
    // push new merkle tree

    // Update on-chain merkle tree hash
    this.merkleTree.set(merkleTree);
  }
}
