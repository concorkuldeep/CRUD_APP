import * as Keychain from 'react-native-keychain';

export const saveTokens = async (accessToken, refreshToken, userDetails) => {
    try {
        await Keychain.setGenericPassword('accessToken', accessToken);

        if (refreshToken) {
            await Keychain.setInternetCredentials('auth', 'refreshToken', refreshToken);
        }
        if (userDetails) {
            await Keychain.setInternetCredentials('user', 'userDetails', JSON.stringify(userDetails))
        }
        return true;
    } catch (e) {
        console.error("Error whilse saving tokens : ", e);
        return false;
    }

}

export const getAccessToken = async () => {
    try {
        const credential = await Keychain.getGenericPassword();
        if (credential) {
            return credential.password;
        }
        return null
    } catch (error) {
        console.error("Error getting access token : ", error);
        return null;
    }
}

export const getRefreshToken = async () => {
    try {
        const credentials = await Keychain.getInternetCredentials('auth');
        if (credentials) {
            return credentials.password;
        }
        return null;
    } catch (error) {
        console.error('Error getting refresh token:', error);
        return null;
    }
};

export const getUserDetails = async()=>{
    try {
        const userDetails = await Keychain.getInternetCredentials('user');
        if(userDetails){
            return userDetails.password
        }
        return null;
    } catch (error) {
        console.error('Error getting user details :', error);
        return null;
    }
}

export const clearTokens = async () => {
    try {
        await Keychain.resetGenericPassword();
        await Keychain.resetInternetCredentials( {server :'auth'});
        await Keychain.resetInternetCredentials({server :'user'})
        return true;
    } catch (error) {
        console.error('Error clearing tokens:', error);
        return false;
    }
};