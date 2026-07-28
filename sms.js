const GetSMS = require('getsms');
const sms = new GetSMS({
  key: '177294U15a8640801c39bf11bacebea6d324b6b',
  url: 'https://smshub.org/stubs/handler_api.php',
  service: 'smshub'
});
const COUNTRY = 6;
async function getSMSNumber(page) {
  const { balance_number } = await sms.getBalance();
  if (balance_number <= 0) return;
  const { id, number } = await sms.getNumber('go', 'any', COUNTRY);
  await page.type('#deviceAddress', number);
  await page.click('#next-button');
  await sms.setStatus(1, id);
  const { code } = await sms.getCode(id, 60000);
  await page.type('#smsUserPin', code);
  await page.click('#next-button');
  await sms.setStatus(6, id);
}
module.exports = { getSMSNumber };
