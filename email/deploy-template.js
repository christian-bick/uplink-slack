import AWS from 'aws-sdk'
import Promise from 'bluebird'
import fs from 'fs'
const ses = new AWS.SES({ region: 'eu-west-1' })

const templateName = process.argv.length > 2 ? process.argv[2] : null
const create = process.argv.length > 3 ? !!process.argv[3] : false

const deployTemplate = async () => {
  try {
    const html = fs.readFileSync(`./email/templates/${templateName}.html`).toString('UTF-8')
    const text = fs.readFileSync(`./email/templates/${templateName}.txt`).toString('UTF-8')
    const subject = fs.readFileSync(`./email/templates/${templateName}.subject.txt`).toString('UTF-8')

    const params = {
      Template: {
        TemplateName: templateName,
        HtmlPart: html,
        SubjectPart: subject,
        TextPart: text
      }
    }
    if (create) {
      await ses.createTemplate(params).promise()
    } else {
      await ses.updateTemplate(params).promise()
    }

  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

Promise.resolve(deployTemplate())
