<?php

namespace App\Http\Controllers\Api\Deployment;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class GitHubWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $event = $request->header('X-GitHub-Event');
        $delivery = $request->header('X-GitHub-Delivery');
        $signature = $request->header('X-Hub-Signature-256');
        $payload = $request->getContent();
        $secret = config('services.github.webhook_secret', env('GITHUB_WEBHOOK_SECRET'));
        $branch = config('services.github.branch', env('GITHUB_WEBHOOK_BRANCH', 'main'));
        $updateScript = config('services.github.update_script', env('GITHUB_UPDATE_SCRIPT', base_path('../auto-update-from-github.sh')));

        if ($event !== 'push') {
            return response()->json([
                'success' => true,
                'message' => 'Ignored non-push event.',
            ]);
        }

        if (!$secret) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook secret is not configured.',
            ], 500);
        }

        if (!$this->isValidSignature($signature, $payload, $secret)) {
            Log::warning('GitHub webhook rejected due to invalid signature.', [
                'delivery' => $delivery,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid signature.',
            ], 401);
        }

        $data = $request->json()->all();
        $ref = $data['ref'] ?? null;

        if ($ref !== 'refs/heads/' . $branch) {
            return response()->json([
                'success' => true,
                'message' => 'Push received for a different branch.',
                'branch' => $ref,
            ]);
        }

        if (!is_file($updateScript) || !is_executable($updateScript)) {
            Log::error('GitHub webhook update script missing or not executable.', [
                'script' => $updateScript,
                'delivery' => $delivery,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Update script is not available.',
            ], 500);
        }

        $process = new Process([$updateScript]);
        $process->setTimeout(null);
        $process->setIdleTimeout(null);
        $process->setEnv([
            'APP_PATH' => base_path('..'),
            'BRANCH' => $branch,
        ] + $_ENV + $_SERVER);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::error('GitHub webhook update failed.', [
                'delivery' => $delivery,
                'output' => $process->getOutput(),
                'error_output' => $process->getErrorOutput(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Update script failed.',
            ], 500);
        }

        Log::info('GitHub webhook update completed.', [
            'delivery' => $delivery,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Website updated successfully.',
        ]);
    }

    private function isValidSignature(?string $signature, string $payload, string $secret): bool
    {
        if (!$signature || !str_starts_with($signature, 'sha256=')) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }
}
