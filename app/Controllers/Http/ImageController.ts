import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Drive from '@ioc:Adonis/Core/Drive'
const fs = require('fs')

export default class ImageController {
  public async store ({ request }: HttpContextContract) {
    const image = request.file('image', {
      size: '2mb',
      extnames: ['jpg', 'png', 'gif'],
    })

    if (!image) {
      return
    }

    const fileName = `${cuid()}.${image.extname}`

    // await image.move(Application.tmpPath('uploads'), {
    //   name: fileName,
    // })

    await Drive.use('s3').put(fileName, fs.createReadStream(image.tmpPath), {
      ContentType: `${image.type}/${image.subtype}`,
    })

    return Drive.use('s3').getUrl(fileName)
  }
}
