import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { CreateUpdateOpinionDto, Opinion } from 'src/app/model/Opinion';
import { AuthService } from 'src/app/services/auth.service';
import { OpinionService } from 'src/app/services/opinion.service';
import { DeleteOpinionModalComponent } from './delete-opinion-modal/delete-opinion-modal.component';
import { OpinionModalComponent } from './opinion-modal/opinion-modal.component';
import { OpinionReportModalComponent } from './opinion-report-modal/opinion-report-modal.component';


@Component({
    selector: 'app-opinions',
    templateUrl: './opinions.component.html',
    styleUrls: ['./opinions.component.css']
})
export class OpinionsComponent implements OnChanges
{
    @Input() productId: string;

    opinions$ = new BehaviorSubject<Opinion[]>([]);

    constructor(
        private opinionService: OpinionService,
        protected authService: AuthService,
        private modalService: NgbModal
    ) { }

    ngOnChanges(changes: SimpleChanges): void
    {
        if (!changes['productId'].isFirstChange())
        {
            this.opinionService
                .getOpinions(this.productId)
                .subscribe(data =>
                {
                    this.opinions$.next(data);
                });
        }
    }

    onReactionClick(opinion: Opinion, positive: boolean)
    {
        if (this.isUser())
        {
            if (positive && !opinion.liked)
            {
                this.opinionService
                    .rate(opinion.productId, opinion.opinionId, positive)
                    .subscribe(u => this.replaceUpdated(u));
            }
            else if (!positive && !opinion.disliked)
            {
                this.opinionService
                    .rate(opinion.productId, opinion.opinionId, positive)
                    .subscribe(u => this.replaceUpdated(u));
            }
            else if (positive && opinion.liked)
            {
                this.opinionService
                    .removeReaction(opinion.productId, opinion.opinionId, positive)
                    .subscribe(u => this.replaceUpdated(u));
            }
            else if (!positive && opinion.disliked)
            {
                this.opinionService
                    .removeReaction(opinion.productId, opinion.opinionId, positive)
                    .subscribe(u => this.replaceUpdated(u));
            }
        }
    }

    isAuthor(opinion: Opinion): boolean
    {
        return this.authService.getUsername() === opinion.authorName;
    }

    isUser(): boolean
    {
        return this.authService.getRole() === 'USER';
    }

    openReportModal(opinion: Opinion)
    {
        const modalRef = this.modalService.open(OpinionReportModalComponent, { centered: true });

        (modalRef.componentInstance as OpinionReportModalComponent).opinion = opinion;
    }

    openCreateOpinionModal()
    {
        const modalRef = this.modalService.open(OpinionModalComponent);

        (modalRef.componentInstance as OpinionModalComponent).opinion = new CreateUpdateOpinionDto();

        modalRef.result
            .then((dto: CreateUpdateOpinionDto) =>
            {
                this.opinionService
                    .createOpinion(this.productId, dto)
                    .subscribe(u => this.opinions$.value.push(u));
            })
            .catch(() => { });
    }

    openEditOpinionModal(opinion: Opinion)
    {
        const modalRef = this.modalService.open(OpinionModalComponent);

        (modalRef.componentInstance as OpinionModalComponent).opinion = new CreateUpdateOpinionDto(opinion);

        modalRef.result
            .then((dto: CreateUpdateOpinionDto) =>
            {
                this.opinionService
                    .updateOpinion(opinion.productId, opinion.opinionId, dto)
                    .subscribe(u => this.replaceUpdated(u));
            })
            .catch(() => { });
    }

    openDeleteConfirmationModal(opinion: Opinion)
    {
        const modalRef = this.modalService.open(DeleteOpinionModalComponent, {
            centered: true,
            size: 'sm'
        });

        (modalRef.componentInstance as DeleteOpinionModalComponent).opinion = opinion;

        modalRef.result
            .then((wasDeleted: boolean) =>
            {
                if (wasDeleted)
                {
                    this.opinions$.next(
                        this.opinions$.value.filter(o => o.opinionId !== opinion.opinionId)
                    );
                }
            })
            .catch(() => { });
    }

    private replaceUpdated(updated: Opinion)
    {
        this.opinions$.next(
            this.opinions$.value.map(old =>
            {
                if (old.opinionId == updated.opinionId)
                {
                    Object.assign(old, updated);
                }
                return old;
            })
        );
    }
}
