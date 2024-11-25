import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Journal } from '../target/types/journal';

describe('journal', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.Journal as Program<Journal>;

  const title = "My Journal Entry";
  const message = "This is my first journal entry.";

  // Generate a deterministic keypair for the journal entry account.
  const [journalEntryPubkey, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(title), payer.publicKey.toBuffer()],
    program.programId
  );

  it('Creates a new journal entry', async () => {
    await program.methods
      .createEntry(title, message)
      .accounts({
        journalEntry: journalEntryPubkey,
        owner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const journalEntry = await program.account.journalEntryState.fetch(journalEntryPubkey);
    expect(journalEntry.owner.toBase58()).toEqual(payer.publicKey.toBase58());
    expect(journalEntry.title).toEqual(title);
    expect(journalEntry.message).toEqual(message);
  });

  it('Updates the journal entry message', async () => {
    const newMessage = "This is the updated journal entry message.";

    await program.methods
      .updateEntry(title, newMessage)
      .accounts({
        journalEntry: journalEntryPubkey,
        owner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const journalEntry = await program.account.journalEntryState.fetch(journalEntryPubkey);
    expect(journalEntry.message).toEqual(newMessage);
  });

  it('Deletes the journal entry', async () => {
    await program.methods
      .deleteJournalEntry(title)
      .accounts({
        journalEntry: journalEntryPubkey,
        owner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const journalEntry = await program.account.journalEntryState.fetchNullable(journalEntryPubkey);
    expect(journalEntry).toBeNull();
  });

  it('Fails to create an entry with an empty title', async () => {
    const invalidTitle = ""; // Empty title
    const message = "This should fail.";
  
    await expect(async () => {
      await program.methods
        .createEntry(invalidTitle, message)
        .accounts({
          journalEntry: journalEntryPubkey,
          owner: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
    }).rejects.toThrow(); // Expect an error
  });

  
  it('Fails to update a non-existent entry', async () => {
    const title = "NonExistentEntry";
    const newMessage = "Attempting to update a non-existent entry.";
  
    const [nonExistentPubkey, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(title), payer.publicKey.toBuffer()],
      program.programId
    );
  
    await expect(async () => {
      await program.methods
        .updateEntry(title, newMessage)
        .accounts({
          journalEntry: nonExistentPubkey,
          owner: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc();
    }).rejects.toThrow(); // Expect an error
  });

  
  it('Fails to delete an entry without ownership', async () => {
    const maliciousUser = anchor.web3.Keypair.generate(); // Simulate another user
    const title = "EntryToDelete";
  
    const [entryPubkey, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(title), payer.publicKey.toBuffer()],
      program.programId
    );
  
    // Ensure the entry exists by creating it first
    await program.methods
      .createEntry(title, "This entry will be targeted for unauthorized deletion.")
      .accounts({
        journalEntry: entryPubkey,
        owner: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();
  
    // Malicious user tries to delete the entry
    await expect(async () => {
      await program.methods
        .deleteJournalEntry(title)
        .accounts({
          journalEntry: entryPubkey,
          owner: maliciousUser.publicKey, // Incorrect owner
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([maliciousUser])
        .rpc();
    }).rejects.toThrow(); // Expect an error
  });
  

});
