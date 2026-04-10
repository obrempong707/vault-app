<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait AuthorizesRequests
{
    protected function isAdmin(): bool
    {
        return Auth::user()?->role === 'admin';
    }

    protected function getCustomerId(): ?int
    {
        return Auth::user()?->customer_id;
    }

    protected function getUserId(): ?int
    {
        return Auth::id();
    }

    protected function authorizeAction(bool $condition, string $message = 'Unauthorized access.'): void
    {
        if (!$condition) {
            abort(403, $message);
        }
    }
}
