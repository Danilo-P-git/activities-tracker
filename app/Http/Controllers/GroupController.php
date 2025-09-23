<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;

use App\Models\Group;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Groups",
 *     description="API per la gestione dei gruppi"
 * )
 */
class GroupController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/groups",
     *     tags={"Groups"},
     *     summary="Lista di tutti i gruppi",
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function index()
    {
        try {
            return response()->json(Group::all());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/groups",
     *     tags={"Groups"},
     *     summary="Crea un nuovo gruppo",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Group")
     *     ),
     *     @OA\Response(response=201, description="Creato")
     * )
     */
    public function store(StoreGroupRequest $request)
    {
        try {
            $data = $request->validated();
            $eventId = $data['event_id'];
            unset($data['event_id']);
            $group = Group::create($data);
            // Crea la relazione nella pivot solo tra evento e gruppo (senza staff)
            DB::table('event_group_staff')->insert([
                'event_id' => $eventId,
                'group_id' => $group->id,
                'staff_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json($group, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/groups/{id}",
     *     tags={"Groups"},
     *     summary="Mostra un gruppo",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Successo")
     * )
     */
    public function show(Group $group)
    {
        return $group;
    }

    /**
     * @OA\Put(
     *     path="/api/groups/{id}",
     *     tags={"Groups"},
     *     summary="Aggiorna un gruppo",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Group")
     *     ),
     *     @OA\Response(response=200, description="Aggiornato")
     * )
     */
    public function update(UpdateGroupRequest $request, Group $group)
    {
        $group->update($request->validated());
        return response()->json($group);
    }

    /**
     * @OA\Delete(
     *     path="/api/groups/{id}",
     *     tags={"Groups"},
     *     summary="Elimina un gruppo",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=204, description="Eliminato")
     * )
     */
    public function destroy(Group $group)
    {
        $group->delete();
        return response()->json(null, 204);
    }
}
