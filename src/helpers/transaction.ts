import axios, { AxiosResponse } from 'axios';
import { Transaction } from './transaction.interface';

//const config = 

export async function getTransactions() {
  try {
    const res = await axios.get<Transaction[]>(
      process.env.API_URL,
      {
        headers: {
          Auth: process.env.API_KEY,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

export function createTransaction(transactionData:Transaction) {
  axios.post<Transaction>(process.env.API_URL, transactionData, {
    headers: {
      Auth: process.env.API_KEY,
    },
  })
  .then((response: AxiosResponse) => {
    console.log(response.data);
  })
  .catch((error: Error) => {
    console.error(error);
  });
}