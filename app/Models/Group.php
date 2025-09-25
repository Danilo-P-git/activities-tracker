<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @OA\Schema(
 *   schema="Group",
 *   required={"group_name", "number_of_people", "start_date", "end_date"},
 *   @OA\Property(property="id", type="integer", readOnly=true),
 *   @OA\Property(property="group_name", type="string"),
 *   @OA\Property(property="number_of_people", type="integer"),
 *   @OA\Property(property="description", type="string", nullable=true),
 *   @OA\Property(property="date", type="string", format="date", description="Data del gruppo"),
 *   @OA\Property(property="activity_duration", type="integer", nullable=true, description="Durata attività in minuti, null se indefinita"),
 *   @OA\Property(property="is_friend", type="boolean", description="Se true, durata indefinita (amico)"),
 *   @OA\Property(property="created_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="updated_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="deleted_at", type="string", format="date-time", nullable=true, readOnly=true)
 * )
 */
class Group extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'group_name',
        'number_of_people',
        'is_waiting',
        'is_closed',
        'description',
        'event_id',
        'staff_id',
        'date',
        'activity_duration',
        'is_friend',
        'is_kid',
    ];

    protected $casts = [
        'is_waiting' => 'boolean',
        'is_closed' => 'boolean',
        'is_kid' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
