import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password' 
      ? '/api/v1/users/update-my-password'
      : '/api/v1/users/update-me'

    const res = await axios({
      method: 'PATCH',
      url: url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`)
    }

  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}