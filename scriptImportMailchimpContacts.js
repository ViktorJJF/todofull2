require('dotenv-safe').config();
const initMongo = require('./config/mongo');
initMongo();
const { getMembersByListId } = require('./integrations/mailchimp');
const MailchimpContacts = require('./models/MailchimpContacts');

const MAILCHIMP_ID = '611305aaf05de56880a1fe69';

(async () => {
  const mailchimpMembers = await getMembersByListId('02d3e76bd9', {
    count: 1000,
    offset: 3000,
  });
  await MailchimpContacts.insertMany(
    mailchimpMembers.members.map((el) => ({
      ...el,
      idMailchimpMember: el.id,
      mailchimp_id: MAILCHIMP_ID,
    })),
  );
  console.log('hecho!');
  // console.log('🚀 Aqui *** -> mailchimpMembers', mailchimpMembers);
  // let constant = await MailchimpContacts.find();
  // console.log('🚀 Aqui *** -> constant', constant);
})();
