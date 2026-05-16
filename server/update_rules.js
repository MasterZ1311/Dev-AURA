import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('../aura-a0d6f-firebase-adminsdk-fbsvc-b9af15822b.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'aura-a0d6f'
});

const rules = fs.readFileSync('../firestore.rules', 'utf8');

async function updateRules() {
  try {
    await getSecurityRules().releaseFirestoreRulesetFromSource(rules);
    console.log('Successfully updated Firestore rules.');
  } catch (error) {
    console.error('Error updating rules:', error);
  }
}

updateRules();
