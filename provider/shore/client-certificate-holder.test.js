import { clientCertificateProviders, newError } from 'neo4j-driver-core'
import ClientCertificateHolder from '../../src/connection-provider/client-certificate-holder'

describe('ClientCertificateHolder', () => {
  describe('.getClientCertificate()', () => {
    describe('when provider is not set', () => {
      it('should resolve as null when provider is not set', async () => {
        const config = extendsDefaultConfigWith()
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toBe(null)
        expect(config.loader.load).not.toHaveBeenCalled()
      })
    })

    describe('when provider is set', () => {
      it('should load and resolve the loaded certificate in the first call', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)
      })

      it('should resolve the previous certificate if certificate was not updated', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledTimes(1)
      })

      it('should update certificate when certificate get updated', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const newCertificate = {
          keyfile: 'the new file',
          certfile: 'new cert file'
        }

        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)

        clientCertificateProvider.updateCertificate(newCertificate)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...newCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledTimes(2)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...newCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledTimes(2)
      })

      it('should return same promise when multiple requests are depending on same loaded certificate', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }

        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const promiseStates = []

        clientCertificateProvider.getClientCertificate = jest.fn(() => {
          const promiseState = {}
          const promise = new Promise((resolve, reject) => {
            promiseState.resolve = resolve
            promiseState.reject = reject
          })

          promiseStates.push(promiseState)
          return promise
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        const certPromises = [
          holder.getClientCertificate(),
          holder.getClientCertificate(),
          holder.getClientCertificate()
        ]

        expect(promiseStates.length).toBe(1)
        promiseStates.forEach(promiseState => promiseState.resolve(initialCertificate))

        for (let i = 0; i < certPromises.length - 1; i++) {
          await expect(certPromises[i]).resolves.toEqual({
            ...initialCertificate,
            loaded: true
          })
        }

        expect(config.loader.load).toHaveBeenCalledTimes(1)
      })

      it('should throws when getting certificates fail', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const newCertificate = {
          keyfile: 'the new file',
          certfile: 'new cert file'
        }
        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)

        clientCertificateProvider.updateCertificate(newCertificate)

        const expectedError = newError('Error')
        clientCertificateProvider.getClientCertificate = jest.fn(() => Promise.reject(expectedError))

        await expect(holder.getClientCertificate()).rejects.toEqual(expectedError)

        expect(config.loader.load).toHaveBeenCalledTimes(1)
      })

      it('should recover from getting certificates failures', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const newCertificate = {
          keyfile: 'the new file',
          certfile: 'new cert file'
        }
        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)

        clientCertificateProvider.updateCertificate(newCertificate)

        const expectedError = newError('Error')
        clientCertificateProvider.getClientCertificate = jest.fn(() => Promise.reject(expectedError))

        await expect(holder.getClientCertificate()).rejects.toEqual(expectedError)
        expect(config.loader.load).toHaveBeenCalledTimes(1)

        clientCertificateProvider.getClientCertificate = jest.fn(() => Promise.resolve(newCertificate))

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...newCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(newCertificate)
      })

      it('should throws when loading certificates fail', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const newCertificate = {
          keyfile: 'the new file',
          certfile: 'new cert file'
        }
        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)

        clientCertificateProvider.updateCertificate(newCertificate)

        const expectedError = newError('Error')
        config.loader.load.mockReturnValueOnce(Promise.reject(expectedError))

        await expect(holder.getClientCertificate()).rejects.toEqual(expectedError)

        expect(config.loader.load).toHaveBeenCalledTimes(2)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...newCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(newCertificate)
        expect(config.loader.load).toHaveBeenCalledTimes(3)
      })

      it('should recover from loading certificates fail', async () => {
        const initialCertificate = {
          keyfile: 'the file',
          certfile: 'cert file'
        }
        const newCertificate = {
          keyfile: 'the new file',
          certfile: 'new cert file'
        }
        const clientCertificateProvider = clientCertificateProviders.rotating({
          initialCertificate
        })

        const config = extendsDefaultConfigWith({ clientCertificateProvider })
        const holder = new ClientCertificateHolder(config)

        await expect(holder.getClientCertificate()).resolves.toEqual({
          ...initialCertificate,
          loaded: true
        })
        expect(config.loader.load).toHaveBeenCalledWith(initialCertificate)

        clientCertificateProvider.updateCertificate(newCertificate)

        const expectedError = newError('Error')
        config.loader.load.mockReturnValueOnce(Promise.reject(expectedError))

        await expect(holder.getClientCertificate()).rejects.toEqual(expectedError)

        expect(config.loader.load).toHaveBeenCalledTimes(2)
      })
    })
  })
})

function extendsDefaultConfigWith (params) {
  return {
    clientCertificateProvider: null,
    loader: {
      load: jest.fn(async a => ({ ...a, loaded: true }))
    },
    ...params
  }
}
