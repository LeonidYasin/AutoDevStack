import React from 'react';

type User = { id: number; email: string };

export const UserList: React.FC<{ users: User[] }> = ({ users }) => (
  <ul>
    {users.map(u => (
      <li key={u.id}>{u.email}</li>
    ))}
  </ul>
); 