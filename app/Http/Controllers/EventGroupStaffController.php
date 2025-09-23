<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EventGroupStaff;

/**
 * @OA\Tag(
 *     name="EventGroupStaff",
 *     description="API per la gestione delle relazioni tra eventi, gruppi e staff"
 * )
 */
class EventGroupStaffController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/event-group-staff",
     *     tags={"EventGroupStaff"},
     *     summary="Crea una relazione evento-gruppo-staff",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"event_id","group_id","staff_id"},
     *             @OA\Property(property="event_id", type="integer"),
     *             @OA\Property(property="group_id", type="integer"),
     *             @OA\Property(property="staff_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Creato")
     * )
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'group_id' => 'required|exists:groups,id',
                'staff_id' => 'required|exists:staff,id',
            ]);
            $pivot = EventGroupStaff::withTrashed()->updateOrCreate(
                [
                    'event_id' => $data['event_id'],
                    'group_id' => $data['group_id'],
                    'staff_id' => $data['staff_id'],
                ],
                ['deleted_at' => null]
            );
            return response()->json(['success' => true], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/event-group-staff",
     *     tags={"EventGroupStaff"},
     *     summary="Elimina una relazione evento-gruppo-staff",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"event_id","group_id","staff_id"},
     *             @OA\Property(property="event_id", type="integer"),
     *             @OA\Property(property="group_id", type="integer"),
     *             @OA\Property(property="staff_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=204, description="Eliminato")
     * )
     */
    public function destroy(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|exists:events,id',
            'group_id' => 'required|exists:groups,id',
            'staff_id' => 'required|exists:staff,id',
        ]);

        $deleted = EventGroupStaff::where('event_id', $data['event_id'])
            ->where('group_id', $data['group_id'])
            ->where('staff_id', $data['staff_id'])
            ->delete();
        return response()->json(['success' => true], 204);
    }
    /**
     * Assegna uno staff a una coppia evento-gruppo già esistente (aggiorna la riga con staff_id null).
     */
    /**
     * @OA\Post(
     *     path="/api/event-group-staff/assign",
     *     tags={"EventGroupStaff"},
     *     summary="Assegna uno staff a una coppia evento-gruppo già esistente",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"event_id","group_id","staff_id"},
     *             @OA\Property(property="event_id", type="integer"),
     *             @OA\Property(property="group_id", type="integer"),
     *             @OA\Property(property="staff_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Successo"),
     *     @OA\Response(response=404, description="Nessuna relazione evento-gruppo trovata senza staff.")
     * )
     */
    public function assignStaffToGroup(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|exists:events,id',
            'group_id' => 'required|exists:groups,id',
            'staff_id' => 'required|exists:staff,id',
        ]);

        // Trova la riga con staff_id null e aggiorna
        $pivot = EventGroupStaff::where('event_id', $data['event_id'])
            ->where('group_id', $data['group_id'])
            ->whereNull('staff_id')
            ->first();
        if ($pivot) {
            $pivot->staff_id = $data['staff_id'];
            $pivot->save();
            return response()->json(['success' => true], 200);
        } else {
            return response()->json(['error' => 'Nessuna relazione evento-gruppo trovata senza staff.'], 404);
        }
    }
}
