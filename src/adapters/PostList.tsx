import React from 'react';

type Post = { id: number; email: string };

export const PostList: React.FC<{ users: Post[] }> = ({ users }) => (
  <ul>
    {users.map(u => (
      <li key={u.id}>{u.email}</li>
    ))}
  </ul>
); 