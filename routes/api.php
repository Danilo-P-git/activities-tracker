
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\StaffController;
use App\Models\Group;
use App\Http\Controllers\ConfigurazioneController;

Route::get('/configurazione', [ConfigurazioneController::class, 'show']);
Route::put('/configurazione', [ConfigurazioneController::class, 'update']);
Route::get('/public/groups/{event}', [GroupController::class, 'publicGroups']);

Route::get('/groups/closed', [GroupController::class, 'closed']);

Route::get('events/featured', [EventController::class, 'featured']);

// API pubblica: tutti i gruppi con info sommarie (no auth)
// API: staff di un evento (attivi e non)
Route::get('/events/{event}/staff', [StaffController::class, 'staffByEvent']);

Route::apiResource('events', EventController::class);
Route::apiResource('groups', GroupController::class);
Route::apiResource('staff', StaffController::class);


Route::get('/user', function (Request $request) {
    dd($request->user());
    return $request->user();
})->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->group(function () {
});




