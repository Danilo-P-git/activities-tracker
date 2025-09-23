<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
/**
 * @OA\Schema(
 *   schema="Staff",
 *   required={"full_name", "is_available", "is_busy"},
 *   @OA\Property(property="id", type="integer", readOnly=true),
 *   @OA\Property(property="full_name", type="string"),
 *   @OA\Property(property="is_available", type="string"),
 *   @OA\Property(property="is_busy", type="string"),
 *   @OA\Property(property="created_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="updated_at", type="string", format="date-time", readOnly=true),
 *   @OA\Property(property="deleted_at", type="string", format="date-time", nullable=true, readOnly=true)
 * )
 */



class Staff extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'full_name',
        'is_available',
        'is_busy',
    ];
    public function eventGroupStaff()
    {
        return $this->hasMany(EventGroupStaff::class);
    }

    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_group_staff')
            ->withPivot('group_id')
            ->withTimestamps();
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'event_group_staff')
            ->withPivot('event_id')
            ->withTimestamps();
    }
}
