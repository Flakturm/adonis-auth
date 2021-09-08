import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Drive from '@ioc:Adonis/Core/Drive'
const fs = require('fs')
import User from 'App/Models/User'

export default class AuthController {
    public async register ({ request, response }: HttpContextContract) {
        const validations = await schema.create({
            email: schema.string({}, [
                rules.email(),
                rules.unique({ table: 'users', column: 'email' })
            ]),
            password: schema.string({}, [
                rules.minLength(8),
                rules.confirmed()
            ]),
            username: schema.string({}, [
                rules.unique({ table: 'users', column: 'username' })
            ]),
            gender: schema.string({}, []),
            avatar: schema.file({
                size: '2mb',
                extnames: ['jpg', 'gif', 'png'],
            }),
        })

        const data = await request.validate({
            schema: validations,
            messages: {
                required: '{{ field }} 爲必填',
                'username.unique': '此名稱已被使用了'
            }
        })

        const fileName = `${cuid()}.${data.avatar.extname}`

        await Drive.use('s3').put(fileName, fs.createReadStream(data.avatar.tmpPath), {
            ContentType: `${data.avatar.type}/${data.avatar.subtype}`,
        })

        const image_url = await Drive.use('s3').getUrl(fileName)

        const user = await User.create({
            username: data.username,
            gender: data.gender,
            email: data.email,
            password: data.password,
            avatar_url: image_url
        })

        return response.created(user.serialize({
            fields: {
                omit: ['created_at', 'updated_at', 'id']
            }
        }))
    }

    public async login ({ request, response, auth }: HttpContextContract) {
        const email = await request.input('email')
        const password = await request.input('password')

        try {
            const token = await auth.use('api').attempt(email, password, {
                expiresIn: '24hours',
            })
            return token.toJSON()
        } catch {
            return response.badRequest('帳號或密碼有誤')
        }
    }

    public async logout ({ auth, response }: HttpContextContract) {
        await auth.logout()
        return response.status(204)
    }

    public async me ({ auth, response }: HttpContextContract) {
        if (!auth.user) {
            return response.abort(404)
        }

        return response.send(auth.user.serialize({
            fields: {
                omit: ['created_at', 'updated_at', 'remember_me_token']
            }
        }))
    }
}
