import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { join, merge } from 'lodash-es'
import { env } from 'Constants/environment'
import { isServer } from 'Utils/EnvironmentUtils'

class Requester {
  client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: isServer() ? join([env.homepageUrl, '/api']) : '/api',
      withCredentials: true,
    })

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => Promise.reject(error)
    )
  }

  async get<T>(url: string, params = {}, config = {}): Promise<T> {
    return this.client.get(url, merge({ params }, config))
  }

  async post<T>(url: string, data = {}, config = {}): Promise<T> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data = {}, config = {}): Promise<T> {
    return this.client.put(url, data, config)
  }

  async delete<T>(url: string, config = {}): Promise<T> {
    return this.client.delete(url, config)
  }

  async patch<T>(url: string, data = {}, config = {}): Promise<T> {
    return this.client.patch(url, data, config)
  }
}

export default new Requester()
