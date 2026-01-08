import { useState, useCallback } from "react";
import { axiosClient } from "../services/axios";

export const useAxios = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null)

    const request = useCallback(async (method, url, data = null, config = {}) => {
        setLoading(true);
        setError(null);
        try {
            let response;
            switch (method.toLowerCase()) {
                case 'get':
                    response = await axiosClient.get(url, config)
                    break;
                case 'post':
                    response = await axiosClient.post(url, data, config)
                    break;
                default:
                    throw new Error(`Unsupported method : ${method}`)
            }
            let responseObj = {
                ...response.data,
                status: response.status
            }
            return responseObj;

        } catch (error) {

            setError(error.response?.data?.message || error.message || `Something went wrong.`)
            throw error;

        } finally {
            setLoading(false)
        }

    }, []);


    const get = useCallback((url, config) => request('get', url, null, config), [request]);
    const post = useCallback((url, data, config) => request('post', url, data, config), [request])

    return {
        loading,
        error,
        get,
        post,

    }



}