<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
/**
 * @OA\Schema(
 *   schema="Event",
 *   required={"event_name", "event_date"},
 *   @OA\Property(property="id", type="integer", readOnly=true),
 *   @OA\Property(property="event_name", type="string"),
 *   @OA\Property(property="description", type="string", nullable=true),
 *   @OA\Property(property="event_date", type="string", format="date-time"),
 *   @OA\Property(property="location", type="string", nullable=true),
 *   @OA\Property(property="created_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="updated_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="deleted_at", type="string", format="date-time", nullable=true, readOnly=true)
 * )
 */



class Event extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'event_name',
        'description',
        'event_start_date',
        'event_end_date',
        'location',
    ];

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function staff()
    {
        // Relazione standard belongsToMany, la logica di grouping va nel controller
        return $this->belongsToMany(Staff::class, 'event_staff')
            ->using(EventStaff::class)
            ->withPivot(['added_at', 'removed_at', 'deleted_at']);
    }
}
