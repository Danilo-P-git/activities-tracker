
<?php

use App\Http\Controllers\Auth\ApiLoginController;
use App\Http\Controllers\ConfigurazioneController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\StaffController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Group;

Route::post('/auth/login', [ApiLoginController::class, 'login']);
Route::post('/auth/logout', [ApiLoginController::class, 'logout']);

Route::get('/configurazione', [ConfigurazioneController::class, 'show']);
Route::put('/configurazione', [ConfigurazioneController::class, 'update']);
Route::get('/public/groups/{event}', [GroupController::class, 'publicGroups']);

Route::get('/groups/closed', [GroupController::class, 'closed']);

Route::get('events/featured', [EventController::class, 'featured']);

// API pubblica: tutti i gruppi con info sommarie (no auth)
// API: staff di un evento (attivi e non)
Route::get('/events/{event}/staff', [StaffController::class, 'staffByEvent']);
// API: statistiche staff per evento (attività, tempo in/out arena, idle)
Route::get('/events/{event}/staff/stats', [StaffController::class, 'staffStats']);
// API: metriche staff per evento (attività, tempo arena, pause, idle)
Route::get('/events/{event}/metrics/staff', [MetricsController::class, 'staffMetrics']);
// API: imposta status del periodo corrente (active/break) — pausa senza uscire dall'evento
Route::put('/events/{event}/staff/{staff}/status', [StaffController::class, 'updateEventStatus']);

Route::apiResource('events', EventController::class);
Route::apiResource('groups', GroupController::class);
Route::apiResource('staff', StaffController::class);


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:api');




