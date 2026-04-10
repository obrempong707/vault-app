<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function authenticate(string $email, string $password): ?User
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            Hash::check($password, '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcx3u');
            return null;
        }

        if (!Hash::check($password, $user->password)) {
            return null;
        }

        if ($user->status !== 'active') {
            return null;
        }

        return $user;
    }

    public function createToken(User $user): string
    {
        $user->tokens()->delete();
        return $user->createToken('vaultlogix-web')->plainTextToken;
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
