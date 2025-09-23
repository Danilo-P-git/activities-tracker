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
 *   @OA\Property(property="start_date", type="string", format="date-time"),
 *   @OA\Property(property="end_date", type="string", format="date-time"),
 *   @OA\Property(property="created_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="updated_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="deleted_at", type="string", format="date-time", nullable=true, readOnly=true)
 * )
 */
class Group extends Model
{
    protected $fillable = [
        'group_name',
        'number_of_people',
        'description',
        'start_date',
        'end_date',
    ];
    public function eventGroupStaff()
    {
        return $this->hasMany(EventGroupStaff::class);
    }

    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_group_staff')
            ->withPivot('staff_id')
            ->withTimestamps();
    }

    public function staff()
    {
        return $this->belongsToMany(Staff::class, 'event_group_staff')
            ->withPivot('event_id')
            ->withTimestamps();
    }
}
