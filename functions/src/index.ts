
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

type ChangeDataSnapshot = functions.Change<DataSnapshot>;
type DataSnapshot = admin.database.DataSnapshot;

interface RecursiveData {
  lastKey: string;
  iteration: number;
  records: number;
}

export const batchUpdateUser = functions.database.ref('/triggerUsers').onWrite(async (change: ChangeDataSnapshot) => {
  if (!change.after.exists()) { // record removed - don't execute
    return;
  }

  const updateUsers = async (lastKey: string = '', iteration: number = 0, records: number = 0) => {
    const snapshots: DataSnapshot = await admin.database().ref('/users')
      .orderByKey()
      .startAt(lastKey)
      .limitToFirst(10)
      .once('value');

    const batchUpdate = {};
    let nextKey = null;
    let counter = 0;

    snapshots.forEach(snapshot => {
      const userId = snapshot.key;

      if (userId !== lastKey) {
        counter++;
        batchUpdate[`/users/${userId}/lastProcessed`] = admin.database.ServerValue.TIMESTAMP;

        nextKey = userId;
      }

      return false;
    });

    await admin.database().ref('/')
      .update(batchUpdate);

    if (nextKey) {
      await change.after.ref.set({
        lastKey: nextKey,
        iteration: iteration + 1,
        records: counter + records,
      });
    } else {
      await change.after.ref.remove();

      console.log(`Finished: ${iteration} iterations, ${counter + records} records updated.`);
    }
  };

  const data: RecursiveData = change.after.val();

  if (data && data.lastKey) {
    return updateUsers(data.lastKey, data.iteration, data.records);
  } else {
    return updateUsers();
  }
});

export const batchWriteUser = functions.database.ref('/setupUsers').onCreate(async (snapshot: DataSnapshot) => {
  const refs = [];

  for (let i = 0; i < 100; i++) {
    const ref = admin.database().ref('/users').push({
      lastProcessed: admin.database.ServerValue.TIMESTAMP,
    });

    refs.push(ref);
  }

  await snapshot.ref.remove();

  return Promise.all(refs);
});
