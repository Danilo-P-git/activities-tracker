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
            $eventId = request('event_id');
            $query = Group::with('staff')->where('is_closed', false);
            if ($eventId) {
                $query->where('event_id', $eventId);
            }
            $groups = $query
                ->orderByDesc('is_waiting')
                ->orderBy('created_at', 'asc')
                ->get();
            return response()->json($groups);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // API: lista gruppi chiusi
    public function closed()
    {
        try {
            $eventId = request('event_id');
            $query = Group::with('staff')->where('is_closed', true);
            if ($eventId) {
                $query->where('event_id', $eventId);
            }
            $groups = $query
                ->orderBy('created_at', 'desc')
                ->get();


            return response()->json($groups);
        } catch (\Throwable $th) {
            return response()->json([
                'error' => 'Errore interno',
                'message' => $th->getMessage()
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
            DB::beginTransaction();
            $data = $request->validated();

            $group = Group::create($data);
            $group->load('staff');
            DB::commit();
            return response()->json($group, 201);
        } catch (\Exception $e) {
            DB::rollBack();
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
        $group->load('staff');
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
        try {
            DB::beginTransaction();
            $data = $request->validated();
            $group->update($data);
            $group->load('staff');
            DB::commit();
            return response()->json($group);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Errore interno',
                'message' => $e->getMessage()
            ], 500);
        }
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
