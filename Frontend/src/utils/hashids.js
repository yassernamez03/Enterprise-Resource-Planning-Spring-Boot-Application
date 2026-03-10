import Hashids from 'hashids';

const SALT = 's7K3fP9zR6gT1wN5vJ8xQ0bC4mH2lU';

// Create hashids instance with minimum length of 6 characters
const hashids = new Hashids(SALT, 6);

export const encodeId = (id) => {
  if (!id || isNaN(id)) return null;
  return hashids.encode(id);
};

export const decodeId = (hash) => {
  if (!hash) return null;
  const decoded = hashids.decode(hash);
  return decoded.length > 0 ? decoded[0] : null;
};

export default hashids;